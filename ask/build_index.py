#!/usr/bin/env python3
"""
Build embedding index for AI Exchange video library.
Reads transcripts and analyses, chunks them, generates embeddings,
and stores in ChromaDB.
"""

import json
import sqlite3
from pathlib import Path

import chromadb
from sentence_transformers import SentenceTransformer


def estimate_token_count(text: str) -> int:
    """Estimate token count based on character count (~4 chars per token)."""
    return len(text) // 4


def chunk_text(text: str, max_tokens: int = 500, overlap: int = 50) -> list[dict]:
    """Chunk text into overlapping chunks with metadata."""
    words = text.split()
    chunks = []
    
    if len(words) <= max_tokens:
        return [{"text": text, "start_word": 0, "end_word": len(words)}]
    
    step = max_tokens - overlap
    for i in range(0, len(words), step):
        chunk_words = words[i:i + max_tokens]
        if not chunk_words:
            break
        chunks.append({
            "text": " ".join(chunk_words),
            "start_word": i,
            "end_word": min(i + max_tokens, len(words))
        })
    
    return chunks


def load_video_metadata(db_path: str) -> dict:
    """Load video metadata from SQLite database."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, channel, duration, url FROM videos")
    videos = {}
    for row in cursor.fetchall():
        video_id, title, channel, duration, url = row
        videos[video_id] = {
            "title": title,
            "channel": channel,
            "duration": duration,
            "url": url
        }
    conn.close()
    return videos


def load_analysis(analysis_dir: str, video_id: str) -> dict | None:
    """Load analysis JSON file for a video."""
    analysis_path = Path(analysis_dir) / f"{video_id}.json"
    if not analysis_path.exists():
        return None
    with open(analysis_path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_transcript(transcripts_dir: str, video_id: str) -> str:
    """Load transcript text file."""
    transcript_path = Path(transcripts_dir) / f"{video_id}.txt"
    if not transcript_path.exists():
        return ""
    with open(transcript_path, "r", encoding="utf-8") as f:
        return f.read()


def build_index(transcripts_dir: str, analysis_dir: str, db_path: str):
    """Build the full embedding index."""
    print("Loading video metadata...")
    video_metadata = load_video_metadata(db_path)
    print(f"Found {len(video_metadata)} videos")
    
    print("Loading sentence-transformer model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    
    print("Initializing ChromaDB...")
    client = chromadb.PersistentClient(path="/Users/jhammant/dev/AIExchange/ask/chromadb")
    collection = client.get_or_create_collection(
        name="ai_exchange_videos",
        metadata={"hnsw:space": "cosine"}
    )
    
    print("Processing videos and building chunks...")
    batch_size = 50
    embeddings = []
    metadatas = []
    ids = []
    
    for i, (video_id, video_info) in enumerate(video_metadata.items()):
        if i % 10 == 0:
            print(f"Processing video {i+1}/{len(video_metadata)}: {video_info['title']}")
        
        analysis = load_analysis(analysis_dir, video_id)
        transcript = load_transcript(transcripts_dir, video_id)
        
        if not analysis and not transcript:
            continue
        
        source_text = ""
        if transcript:
            source_text = transcript
        elif analysis and "summary" in analysis:
            source_text = analysis["summary"]
        
        if not source_text:
            continue
        
        chunks = chunk_text(source_text)
        
        for j, chunk in enumerate(chunks):
            chunk_id = f"{video_id}_chunk_{j}"
            
            metadata = {
                "video_id": video_id,
                "title": video_info["title"],
                "channel": video_info.get("channel", ""),
                "url": video_info["url"],
                "chunk_index": j,
                "chunk_start_word": chunk["start_word"],
                "chunk_end_word": chunk["end_word"],
                "text_preview": chunk["text"][:200]
            }
            
            if analysis:
                metadata["topics"] = ", ".join(analysis.get("topics", []))
                metadata["sentiment"] = analysis.get("sentiment", "")
                if "quotes" in analysis and analysis["quotes"]:
                    metadata["relevant_quotes"] = analysis["quotes"][0] if len(analysis["quotes"]) > 0 else ""
            
            embeddings.append(model.encode(chunk["text"]).tolist())
            metadatas.append(metadata)
            ids.append(chunk_id)
        
        if len(embeddings) >= batch_size:
            collection.add(
                ids=ids,
                embeddings=embeddings,
                metadatas=metadatas
            )
            print(f"  Added {len(ids)} chunks")
            embeddings = []
            metadatas = []
            ids = []
    
    if embeddings:
        collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas
        )
        print(f"  Added {len(ids)} chunks (final batch)")
    
    print(f"\nIndex build complete!")
    print(f"Total videos processed: {len(video_metadata)}")
    print(f"Total chunks added: {collection.count()}")
    
    return collection


def main():
    transcripts_dir = "/Users/jhammant/dev/AIExchange/video-analysis/transcripts"
    analysis_dir = "/Users/jhammant/dev/AIExchange/video-analysis/analysis/structured"
    db_path = "/Users/jhammant/dev/AIExchange/video-analysis/database/videos.db"
    
    build_index(transcripts_dir, analysis_dir, db_path)


if __name__ == "__main__":
    main()
