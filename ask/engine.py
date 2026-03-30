#!/usr/bin/env python3
"""
Query engine for AI Exchange RAG chatbot.
Handles question embedding, retrieval from ChromaDB, and LLM response generation.
"""

import os
from typing import Dict, List

import chromadb
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

load_dotenv()


class QueryEngine:
    def __init__(self, chromadb_path: str = "/Users/jhammant/dev/AIExchange/ask/chromadb"):
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        client = chromadb.PersistentClient(path=chromadb_path)
        self.collection = client.get_or_create_collection(name="ai_exchange_videos")
    
    def embed_query(self, question: str) -> List[float]:
        """Embed a question into vector space."""
        return self.model.encode(question).tolist()
    
    def retrieve_relevant_chunks(self, question: str, top_k: int = 8) -> List[Dict]:
        """Retrieve top-k relevant chunks from ChromaDB."""
        query_embedding = self.embed_query(question)
        results = self.collection.query(query_embeddings=[query_embedding], n_results=top_k)
        
        chunks = []
        for i in range(len(results["ids"][0])):
            doc = results["documents"][0][i] if i < len(results["documents"][0]) else ""
            meta = results["metadatas"][0][i] if i < len(results["metadatas"][0]) else {}
            dist = results["distances"][0][i] if i < len(results["distances"][0]) else 1
            
            chunk = {
                "id": results["ids"][0][i],
                "text": doc if isinstance(doc, str) else "",
                "metadata": meta,
                "score": 1 - dist
            }
            chunks.append(chunk)
        
        return chunks
    
    def build_prompt(self, question: str, chunks: List[Dict]) -> str:
        """Build a prompt with context from retrieved chunks."""
        context_parts = []
        for i, chunk in enumerate(chunks):
            metadata = chunk.get("metadata", {}) or {}
            
            timestamp = self._estimate_timestamp(metadata)
            text_preview = chunk.get("text", "") or ""
            
            if not isinstance(text_preview, str):
                text_preview = ""
            
            preview_text = text_preview[:500]
            title = metadata.get("title", "Unknown")
            channel = metadata.get("channel", "Unknown")
            
            context_parts.append(
                f"[Chunk {i+1}] Video: {title}\n"
                f"  Speaker/Channel: {channel}\n"
                f"  Timestamp: {timestamp}\n"
                f"  Content: {preview_text}..."
            )
        
        context = "\n\n".join(context_parts)
        
        prompt = f"""You are a helpful assistant for the AI Exchange video library. 
Use the following context from conference talks to answer the question.

Context from videos:
{context}

Question: {question}

Instructions:
1. Answer the question using ONLY information from the context above
2. If the answer isn't in the context, say "I don't have enough information to answer this question"
3. Always cite your sources with the video title and timestamp
4. Include YouTube links when possible

Answer:"""
        
        return prompt
    
    def _estimate_timestamp(self, metadata: Dict) -> str:
        """Estimate YouTube timestamp from chunk position."""
        start_word = metadata.get("chunk_start_word", 0) or 0
        if not isinstance(start_word, (int, float)):
            start_word = 0
        
        words_per_minute = 150
        start_minutes = (start_word / words_per_minute)
        
        minute = int(start_minutes)
        second = int((start_minutes - minute) * 60)
        
        return f"{minute:02d}:{second:02d}"
    
    def call_llm(self, prompt: str) -> str:
        """Call the LLM (LM Studio or OpenRouter)."""
        lm_studio_url = os.getenv("LM_STUDIO_URL", "http://localhost:1234/v1/chat/completions")
        
        try:
            import requests
            headers = {"Content-Type": "application/json"}
            payload = {
                "model": "default",
                "messages": [
                    {"role": "system", "content": "You are a helpful assistant for the AI Exchange video library."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "max_tokens": -1,
                "stream": False
            }
            
            response = requests.post(lm_studio_url, json=payload, headers=headers, timeout=60)
            if response.status_code == 200:
                result = response.json()
                return result.get("choices", [{}])[0].get("message", {}).get("content", "")
        except Exception as e:
            print(f"LM Studio failed: {e}")
        
        return self._call_openrouter(prompt)
    
    def _call_openrouter(self, prompt: str) -> str:
        """Call OpenRouter API."""
        import requests
        
        api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
        if not api_key:
            return "Error: No API key configured. Set OPENROUTER_API_KEY or LM_STUDIO_URL environment variable."
        
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "https://github.com/anomalyco/AIExchange",
            "X-Title": "AI Exchange RAG Chatbot",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "openai/gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": "You are a helpful assistant for the AI Exchange video library."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=60)
            if response.status_code == 200:
                result = response.json()
                return result.get("choices", [{}])[0].get("message", {}).get("content", "")
            else:
                return f"Error from OpenRouter: {response.status_code} - {response.text}"
        except Exception as e:
            return f"Error calling LLM: {e}"
    
    def answer_question(self, question: str) -> Dict:
        """Full pipeline: retrieve chunks and generate answer."""
        chunks = self.retrieve_relevant_chunks(question, top_k=8)
        
        prompt = self.build_prompt(question, chunks)
        answer = self.call_llm(prompt)
        
        sources = []
        seen_videos = set()
        
        for chunk in chunks:
            metadata = chunk.get("metadata", {})
            if not isinstance(metadata, dict):
                metadata = {}
            
            video_id = metadata.get("video_id", "")
            
            if video_id and video_id not in seen_videos:
                seen_videos.add(video_id)
                
                timestamp = self._estimate_timestamp(metadata)
                youtube_url = metadata.get("url", "") or ""
                
                if youtube_url and timestamp:
                    if "youtu.be/" in youtube_url:
                        vid_id = youtube_url.split("youtu.be/")[-1].split("?")[0]
                    elif "youtube.com/watch?v=" in youtube_url:
                        vid_id = youtube_url.split("watch?v=")[-1].split("&")[0]
                    else:
                        vid_id = video_id
                    youtube_url = f"https://youtu.be/{vid_id}?t={timestamp}"
                
                sources.append({
                    "video_id": video_id,
                    "title": metadata.get("title", ""),
                    "channel": metadata.get("channel", ""),
                    "timestamp": timestamp,
                    "youtube_url": youtube_url,
                    "text_preview": chunk.get("text", "") or "",
                    "relevance_score": round(chunk.get("score", 0), 3),
                    "topics": metadata.get("topics", "")
                })
        
        sources.sort(key=lambda x: x["relevance_score"], reverse=True)
        
        return {
            "question": question,
            "answer": answer,
            "sources": sources,
            "retrieved_chunks": len(chunks)
        }


def main():
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python engine.py <question>")
        print("Example: python engine.py 'What are the key trends in enterprise AI adoption?'")
        return
    
    question = " ".join(sys.argv[1:])
    
    engine = QueryEngine()
    result = engine.answer_question(question)
    
    print(f"\n{'='*60}")
    print(f"Question: {question}\n")
    print(f"Answer:\n{result['answer']}\n")
    
    if result["sources"]:
        print(f"\nSources ({len(result['sources'])}):")
        for i, source in enumerate(result["sources"], 1):
            print(f"\n{i}. {source['title']}")
            print(f"   Channel: {source['channel']}")
            print(f"   Timestamp: {source['timestamp']}")
            print(f"   URL: {source['youtube_url']}")
    else:
        print("\nNo sources found.")


if __name__ == "__main__":
    main()
