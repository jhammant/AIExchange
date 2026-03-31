#!/usr/bin/env python3
"""
Cross-Video Analysis Engine for AI Exchange

This module provides advanced analytics capabilities:
1. Consensus detection across episodes
2. Contrarian claims extraction
3. Topic clustering and trend analysis
4. Speaker expertise mapping
5. Timestamp link generation from transcripts
"""

import os
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from collections import defaultdict, Counter
import math

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    print("sentence-transformers not available. Install with: pip install sentence-transformers")
    SentenceTransformer = None


class AnalysisEngine:
    def __init__(self, data_dir: str = "./data/results"):
        self.data_dir = Path(data_dir)
        self.transcriptions_file = self.data_dir / "transcriptions.json"
        self.metadata_file = self.data_dir / "video_metadata.json"
        self.analyses_file = self.data_dir / "analyses.json"

        # Load data
        self.transcriptions = []
        self.metadata_list = []
        self.analyses = {}

        if os.path.exists(self.transcriptions_file):
            with open(self.transcriptions_file, 'r') as f:
                self.transcriptions = json.load(f)

        metadata_file = self.data_dir / "video_metadata.json"
        if os.path.exists(metadata_file):
            with open(metadata_file, 'r') as f:
                self.metadata_list = json.load(f)

        # Build video lookup
        self.video_lookup = {}
        for meta in self.metadata_list:
            if isinstance(meta, dict):
                video_id = meta.get('video_id') or meta.get('id')
                if video_id:
                    self.video_lookup[video_id] = meta

        # Load existing analyses
        if os.path.exists(self.analyses_file):
            with open(self.analyses_file, 'r') as f:
                self.analyses = json.load(f)

        # Initialize embedding model if available
        self.embedding_model = None
        if SentenceTransformer:
            try:
                self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            except Exception as e:
                print(f"Could not load embedding model: {e}")

    def get_video_metadata(self, video_id: str) -> Dict:
        """Get metadata for a specific video."""
        return self.video_lookup.get(video_id, {})

    def parse_timestamp(self, word_count: int) -> str:
        """Convert word count to YouTube timestamp format (MM:SS)."""
        words_per_minute = 150
        total_minutes = word_count / words_per_minute

        minutes = int(total_minutes)
        seconds = int((total_minutes - minutes) * 60)

        return f"{minutes:02d}:{seconds:02d}"

    def create_timestamp_link(self, video_id: str, word_count: int) -> str:
        """Create a clickable YouTube timestamp link."""
        timestamp = self.parse_timestamp(word_count)

        # Get video URL from metadata
        metadata = self.get_video_metadata(video_id)
        video_url = metadata.get('url', '')

        # Create youtu.be link with timestamp
        if video_url:
            if 'youtu.be/' in video_url:
                vid_id = video_url.split('youtu.be/')[-1].split('?')[0]
            elif 'youtube.com/watch?v=' in video_url:
                vid_id = video_url.split('watch?v=')[-1].split('&')[0]
            else:
                vid_id = video_id
        else:
            # Generate YouTube URL from video ID (assuming standard format)
            vid_id = video_id
            if not vid_id.startswith('watch?v='):
                # Assume video_id is the actual YouTube ID
                pass

        return f"https://youtu.be/{vid_id}?t={timestamp}"

    def extract_timestamps_from_text(self, text: str) -> List[Tuple[str, int, str]]:
        """
        Extract potential timestamps from text and create links.

        Looks for patterns like:
        - "at 5:30" -> minute:second
        - "around 10 minutes in"
        - "at the 2:45 mark"
        """
        patterns = [
            # Pattern: "at X:YY" or "at XX:YY"
            (r'at\s+(\d{1,2}):(\d{2})', lambda m: f"{int(m.group(1)):02d}:{int(m.group(2)):02d}"),
            # Pattern: "around X minutes in"
            (r'around\s+(\d+)\s+minutes?\s+in', lambda m: f"{int(m.group(1)):02d}:00"),
            # Pattern: "at the X:YY mark"
            (r'at\s+the\s+(\d{1,2}):(\d{2})\s+mark', lambda m: f"{int(m.group(1)):02d}:{int(m.group(2)):02d}"),
            # Pattern: "beginning at X:YY"
            (r'beginning\s+at\s+(\d{1,2}):(\d{2})', lambda m: f"{int(m.group(1)):02d}:{int(m.group(2)):02d}"),
        ]

        timestamps = []
        lines = text.split('\n')

        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue

            for pattern, format_fn in patterns:
                match = re.search(pattern, line.lower())
                if match:
                    timestamp = format_fn(match)
                    # Estimate word count for this timestamp
                    estimated_words = i * 10 + len(line.split())
                    link = self.create_timestamp_link("unknown", estimated_words)
                    timestamps.append((line.strip(), timestamp, link))

        return timestamps

    def build_consensus_database(self) -> Dict[str, List[Dict]]:
        """
        Build a database of consensus claims across videos.

        Returns dict mapping topics/claims to list of videos supporting them.
        """
        consensus_db = defaultdict(list)

        for trans in self.transcriptions:
            video_id = trans.get('video_id', 'unknown')
            segments = trans.get('segments', [])

            if not segments:
                continue

            full_text = trans.get('text', '')

            # Analyze each segment for claims
            for i, segment in enumerate(segments):
                text = segment.get('text', '')
                start = segment.get('start', 0)

                # Look for consensus-indicating phrases
                consensus_phrases = [
                    r'across.*episodes', r'throughout.*series', r'multiple.*agre',
                    r'consensus.*is', r'majority.*agre', r'three.* agre',
                    r'commonly.*recognize', r'unanimous.*agreem',
                ]

                for phrase in consensus_phrases:
                    if re.search(phrase, text.lower()):
                        # Extract the claim
                        claim = self._extract_claim_from_context(text)
                        if claim:
                            consensus_db[claim].append({
                                'video_id': video_id,
                                'timestamp': self.parse_timestamp(int(start * 150)),
                                'context': text[:200],
                                'start_word': int(start * 150)
                            })

        return dict(consensus_db)

    def _extract_claim_from_context(self, context: str) -> Optional[str]:
        """Extract a claim from surrounding context."""
        # Look for patterns that indicate a statement/claim
        patterns = [
            r'(.{50,200}?)\.',  # Grab sentence
        ]

        for pattern in patterns:
            match = re.search(pattern, context)
            if match:
                return match.group(1).strip()

        # If no pattern matches, return truncated context
        return context[:200] if len(context) > 50 else None

    def find_contrarian_claims(self, min_confidence: float = 0.7) -> List[Dict]:
        """
        Find contrarian or minority views across videos.

        Looks for phrases indicating disagreement, skepticism, or alternative views.
        """
        contrarian_claims = []

        contrast_phrases = [
            r'contrary.*{1,3}view', r'disagre.*with',
            r'minority.*position', r'unpopular.*view',
            r'controversial.*claim', r'debatable.*whether',
            r'some.*argu', r'others.*claim', r'on.*other.*hand',
            r'however.*point', r'unlike.*view',
        ]

        for trans in self.transcriptions:
            video_id = trans.get('video_id', 'unknown')
            metadata = self.get_video_metadata(video_id)
            title = metadata.get('title', 'Unknown')
            channel = metadata.get('channel', 'Unknown')

            segments = trans.get('segments', [])
            for i, segment in enumerate(segments):
                text = segment.get('text', '')

                for phrase in contrast_phrases:
                    if re.search(phrase, text.lower()):
                        start = segment.get('start', 0)

                        contrarian_claims.append({
                            'video_id': video_id,
                            'video_title': title,
                            'channel': channel,
                            'timestamp': self.parse_timestamp(int(start * 150)),
                            'claim': text[:250],
                            'start_word': int(start * 150),
                            'relevance': self._calculate_claim_relevance(text)
                        })

        # Sort by relevance and deduplicate
        seen = set()
        unique_claims = []
        for claim in sorted(contrarian_claims, key=lambda x: x['relevance'], reverse=True):
            claim_key = (claim['video_id'], claim['timestamp'][:5])
            if claim_key not in seen:
                seen.add(claim_key)
                unique_claims.append(claim)

        return unique_claims[:100]  # Return top 100

    def _calculate_claim_relevance(self, text: str) -> float:
        """Calculate relevance score for a claim."""
        score = 0.5

        # Boost for specific indicators
        if 'study' in text.lower() or 'research' in text.lower():
            score += 0.2
        if 'evidence' in text.lower() or 'data' in text.lower():
            score += 0.15
        if 'expert' in text.lower() or 'scientist' in text.lower():
            score += 0.1

        return min(score, 1.0)

    def cluster_topics(self, threshold: float = 0.7) -> Dict[str, List[Dict]]:
        """
        Cluster videos and content by topic using embeddings.

        Groups similar content together based on semantic similarity.
        """
        if not self.embedding_model:
            # Fallback to keyword-based clustering
            return self._keyword_clustering()

        # Collect all content with embeddings
        content_items = []
        for trans in self.transcriptions:
            video_id = trans.get('video_id', 'unknown')
            metadata = self.get_video_metadata(video_id)

            # Get title for embedding
            title = metadata.get('title', '')
            full_text = trans.get('text', '')[:1000]  # Limit for efficiency

            if not title and not full_text:
                continue

            text_to_embed = f"{title} {full_text}"

            try:
                embedding = self.embedding_model.encode(text_to_embed).tolist()
                content_items.append({
                    'video_id': video_id,
                    'title': title,
                    'embedding': embedding,
                    'full_text': full_text
                })
            except Exception as e:
                print(f"Could not embed video {video_id}: {e}")

        # Simple clustering: group by similarity
        clusters = defaultdict(list)
        used = set()

        for i, item in enumerate(content_items):
            if i in used:
                continue

            # Start new cluster
            cluster_id = f"cluster_{len(clusters)}"
            clusters[cluster_id].append(item)
            used.add(i)

            # Find similar items
            for j, other in enumerate(content_items):
                if j in used or i == j:
                    continue

                # Cosine similarity
                sim = self._cosine_similarity(
                    item['embedding'],
                    other['embedding']
                )

                if sim >= threshold:
                    clusters[cluster_id].append(other)
                    used.add(j)

        return dict(clusters)

    def _keyword_clustering(self) -> Dict[str, List[Dict]]:
        """Fallback keyword-based clustering."""
        topics = [
            'AI Safety', 'Machine Learning', 'Deep Learning',
            'Neural Networks', 'NLP', 'Computer Vision',
            'Business Strategy', 'Technology Policy',
            'Robotics', 'Automation'
        ]

        clusters = {}

        for trans in self.transcriptions:
            video_id = trans.get('video_id', 'unknown')
            metadata = self.get_video_metadata(video_id)
            title = metadata.get('title', '').lower()
            text = trans.get('text', '').lower()[:500]

            for topic in topics:
                if any(word in title or word in text for word in topic.lower().split()):
                    if topic not in clusters:
                        clusters[topic] = []
                    clusters[topic].append({
                        'video_id': video_id,
                        'title': metadata.get('title', 'Unknown'),
                        'topic_match': topic
                    })
                    break

        return clusters

    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        if len(vec1) != len(vec2):
            return 0.0

        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm1 = math.sqrt(sum(a * a for a in vec1))
        norm2 = math.sqrt(sum(b * b for b in vec2))

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return dot_product / (norm1 * norm2)

    def analyze_speakers(self) -> Dict[str, Dict]:
        """Analyze speaker patterns across all videos."""
        speakers = {}

        for trans in self.transcriptions:
            video_id = trans.get('video_id', 'unknown')
            metadata = self.get_video_metadata(video_id)

            speaker_name = metadata.get('channel', 'Unknown')
            if not isinstance(speaker_name, str):
                speaker_name = "Unknown"

            if speaker_name not in speakers:
                speakers[speaker_name] = {
                    'name': speaker_name,
                    'videos': [],
                    'total_words': 0,
                    'segments_count': 0,
                    'topics': set(),
                    'appearances': 0
                }

            segments = trans.get('segments', [])
            speakers[speaker_name]['videos'].append({
                'video_id': video_id,
                'title': metadata.get('title', 'Unknown')
            })

            # Extract topics from transcript
            text = trans.get('text', '').lower()
            for word in ['ai', 'machine learning', 'neural network',
                        'model', 'data', 'algorithm']:
                if word in text:
                    speakers[speaker_name]['topics'].add(word)

            speakers[speaker_name]['segments_count'] += len(segments)
            speakers[speaker_name]['appearances'] += 1

        # Convert sets to lists for JSON serialization
        for speaker in speakers.values():
            speaker['topics'] = list(speaker['topics'])

        return speakers

    def build_topic_graph(self) -> Dict:
        """Build a graph of topic relationships."""
        topic_cooccurrence = defaultdict(lambda: defaultdict(int))

        for trans in self.transcriptions:
            text = trans.get('text', '').lower()
            words = set(re.findall(r'\b\w+\b', text))

            # Find topic keywords
            topics_of_interest = [
                'ai', 'machine learning', 'deep learning',
                'neural network', 'model', 'data', 'algorithm',
                'training', 'dataset', 'research'
            ]

            found_topics = [t for t in topics_of_interest if any(w in text for w in t.split())]

            # Count co-occurrences
            for i, topic1 in enumerate(found_topics):
                for topic2 in found_topics[i+1:]:
                    topic_cooccurrence[topic1][topic2] += 1
                    topic_cooccurrence[topic2][topic1] += 1

        return {
            'nodes': list(topic_cooccurrence.keys()),
            'edges': [
                {'source': t1, 'target': t2, 'weight': count}
                for t1, targets in topic_cooccurrence.items()
                for t2, count in targets.items()
            ]
        }

    def save_analysis_results(self):
        """Save all analysis results to file."""
        # Update consensus database
        self.analyses['consensus'] = self.build_consensus_database()

        # Update contrarian claims
        self.analyses['contrarian_claims'] = self.find_contrarian_claims()

        # Update topic clusters
        self.analyses['topic_clusters'] = self.cluster_topics()

        # Update speaker analysis
        self.analyses['speakers'] = self.analyze_speakers()

        # Update topic graph
        self.analyses['topic_graph'] = self.build_topic_graph()

        # Save to file
        with open(self.analyses_file, 'w') as f:
            json.dump(self.analyses, f, indent=2)

        print(f"Analysis results saved to {self.analyses_file}")
        return self.analyses

    def generate_timestamp_links_for_video(self, video_id: str) -> List[Dict]:
        """Generate timestamp links for a specific video from its transcript."""
        links = []

        for trans in self.transcriptions:
            if trans.get('video_id') == video_id:
                segments = trans.get('segments', [])

                for i, segment in enumerate(segments):
                    text = segment.get('text', '')
                    start = segment.get('start', 0)

                    # Create a meaningful label for the timestamp
                    label = self._create_timestamp_label(text)

                    # Get video metadata for URL
                    metadata = self.get_video_metadata(video_id)
                    link = self.create_timestamp_link(video_id, int(start * 150))

                    links.append({
                        'timestamp': self.parse_timestamp(int(start * 150)),
                        'label': label,
                        'link': link,
                        'start_word': int(start * 150)
                    })

                break

        return links

    def _create_timestamp_label(self, text: str) -> str:
        """Create a meaningful label from transcript text."""
        # Remove line breaks and extra spaces
        text = re.sub(r'\s+', ' ', text).strip()

        # Truncate if too long
        if len(text) > 80:
            text = text[:77] + '...'

        return text

    def search_across_videos(self, query: str) -> List[Dict]:
        """Search across all videos for relevant content."""
        results = []

        query_lower = query.lower()

        for trans in self.transcriptions:
            video_id = trans.get('video_id', 'unknown')
            metadata = self.get_video_metadata(video_id)

            # Search in text
            text = trans.get('text', '').lower()

            # Find matching segments
            if query_lower in text:
                segments = trans.get('segments', [])

                for segment in segments:
                    seg_text = segment.get('text', '').lower()
                    if query_lower in seg_text:
                        start = segment.get('start', 0)

                        # Create context around match
                        match_pos = seg_text.find(query_lower)
                        start_ctx = max(0, match_pos - 50)
                        end_ctx = min(len(seg_text), match_pos + len(query) + 50)

                        results.append({
                            'video_id': video_id,
                            'video_title': metadata.get('title', 'Unknown'),
                            'channel': metadata.get('channel', 'Unknown'),
                            'timestamp': self.parse_timestamp(int(start * 150)),
                            'link': self.create_timestamp_link(video_id, int(start * 150)),
                            'context': seg_text[start_ctx:end_ctx],
                            'relevance': 1.0
                        })

        # Sort by relevance and deduplicate
        seen = set()
        unique_results = []
        for r in sorted(results, key=lambda x: x['relevance'], reverse=True):
            key = (r['video_id'], r['timestamp'])
            if key not in seen:
                seen.add(key)
                unique_results.append(r)

        return unique_results


def main():
    """Main function to run analysis."""
    import argparse

    parser = argparse.ArgumentParser(description='AI Exchange Analysis Engine')
    parser.add_argument('--data-dir', default='./data/results',
                       help='Directory containing analysis data')
    parser.add_argument('--output', '-o', default='./data/results/analyses.json',
                       help='Output file for analysis results')
    parser.add_argument('--search', '-s', help='Search across videos')
    parser.add_argument('--consensus', action='store_true', help='Find consensus claims')
    parser.add_argument('--contrarian', action='store_true', help='Find contrarian views')
    parser.add_argument('--topics', action='store_true', help='Cluster topics')
    parser.add_argument('--speakers', action='store_true', help='Analyze speakers')

    args = parser.parse_args()

    engine = AnalysisEngine(args.data_dir)

    if args.search:
        results = engine.search_across_videos(args.search)
        print(f"Found {len(results)} matches:")
        for i, r in enumerate(results[:20], 1):
            print(f"\n{i}. [{r['timestamp']}] {r['video_title']}")
            print(f"   Link: {r['link']}")
            print(f"   Context: ...{r['context']}...")

    elif args.consensus:
        consensus = engine.build_consensus_database()
        print(f"Found {len(consensus)} consensus topics")
        for topic, videos in list(consensus.items())[:10]:
            print(f"\n{topic}:")
            for v in videos[:3]:
                print(f"  - [{v['timestamp']}] {v.get('video_id', 'Unknown')}")

    elif args.contrarian:
        claims = engine.find_contrarian_claims()
        print(f"Found {len(claims)} contrarian claims:")
        for i, claim in enumerate(claims[:20], 1):
            print(f"\n{i}. [{claim['timestamp']}] {claim.get('video_title', 'Unknown')}")
            print(f"   {claim['claim'][:100]}...")

    elif args.topics:
        clusters = engine.cluster_topics()
        print(f"Found {len(clusters)} topic clusters:")
        for cluster_id, items in list(clusters.items())[:10]:
            print(f"\n{cluster_id}: {len(items)} items")

    elif args.speakers:
        speakers = engine.analyze_speakers()
        print(f"Found {len(speakers)} speakers:")
        for name, data in list(speakers.items())[:10]:
            print(f"\n{name}: {data['appearances']} appearances")

    else:
        # Run full analysis
        results = engine.save_analysis_results()
        print(f"Analysis complete. Results saved to {args.output}")
        print(f"Consensus topics: {len(results.get('consensus', {}))}")
        print(f"Contrarian claims: {len(results.get('contrarian_claims', []))}")
        print(f"Topic clusters: {len(results.get('topic_clusters', {}))}")


if __name__ == '__main__':
    main()
