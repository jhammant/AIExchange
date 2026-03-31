#!/usr/bin/env python3
"""
Learning Extractor for AI Exchange

This module extracts actionable knowledge and insights from video transcripts,
creating a unified learning platform that connects concepts across episodes.
"""

import os
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from collections import defaultdict
from dataclasses import dataclass, field, asdict
import hashlib


@dataclass
class LearningExtract:
    """Represents a single extracted learning from video content."""
    id: str
    video_id: str
    timestamp_start: int  # in seconds
    timestamp_end: int  # in seconds
    title: str = ""
    content: str = ""
    extract_type: str = ""  # principle, warning, example, advice, etc.
    topic: str = ""
    keywords: List[str] = field(default_factory=list)
    confidence: float = 0.0
    related_concepts: List[str] = field(default_factory=list)
    source_link: str = ""


class LearningExtractor:
    """Extracts and organizes knowledge from video transcripts."""

    def __init__(self, data_dir: str = "./data/results"):
        self.data_dir = Path(data_dir)
        self.transcriptions_file = self.data_dir / "transcriptions.json"
        self.metadata_file = self.data_dir / "video_metadata.json"

        # Load data
        self.transcriptions = []
        if os.path.exists(self.transcriptions_file):
            with open(self.transcriptions_file, 'r') as f:
                self.transcriptions = json.load(f)

        # Video metadata lookup
        self.video_metadata = {}
        if os.path.exists(self.metadata_file):
            with open(self.metadata_file, 'r') as f:
                for item in json.load(f):
                    vid = item.get('video_id') or item.get('id')
                    if vid:
                        self.video_metadata[vid] = item

        # Extracted knowledge storage
        self.extracts: List[LearningExtract] = []

    def generate_id(self, content: str, video_id: str) -> str:
        """Generate unique ID for an extract."""
        hash_input = f"{video_id}:{content[:100]}"
        return hashlib.md5(hash_input.encode()).hexdigest()[:12]

    def get_video_title(self, video_id: str) -> str:
        """Get video title from metadata."""
        if video_id in self.video_metadata:
            return self.video_metadata[video_id].get('title', 'Unknown')
        return f"Video {video_id}"

    def create_source_link(self, video_id: str, timestamp: int) -> str:
        """Create a YouTube link with timestamp."""
        metadata = self.video_metadata.get(video_id, {})
        url = metadata.get('url', '')

        if 'youtu.be/' in url:
            vid_id = url.split('youtu.be/')[-1].split('?')[0]
        elif 'youtube.com/watch?v=' in url:
            vid_id = url.split('watch?v=')[-1].split('&')[0]
        else:
            vid_id = video_id

        return f"https://youtu.be/{vid_id}?t={timestamp}"

    def parse_timestamp(self, seconds: int) -> str:
        """Convert seconds to MM:SS format."""
        minutes = int(seconds // 60)
        sec = int(seconds % 60)
        return f"{minutes:02d}:{sec:02d}"

    def extract_principles(self) -> List[LearningExtract]:
        """
        Extract AI/ML principles from transcripts.

        Looks for patterns like:
        - "The key principle is..."
        - "Always remember to..."
        - "Best practice is..."
        """
        principles = []

        principle_patterns = [
            (r'(?:principle|rule|best practice)\s+(?:is|are)\s+([^.!?]{30,200}[.!?])',
             'principle'),
            (r'(?:always|never|must|should)\s+(\w+)\s+([^.!?]{20,150}[.!?])',
             'guideline'),
            (r'(?:key|important|critical)\s+(?:aspect|factor|consideration)\s+is\s+([^.!?]{30,150}[.!?])',
             'insight'),
        ]

        for trans in self.transcriptions:
            video_id = trans.get('video_id', 'unknown')
            title = self.get_video_title(video_id)
            segments = trans.get('segments', [])

            for segment in segments:
                text = segment.get('text', '')
                start = int(segment.get('start', 0))

                for pattern, extract_type in principle_patterns:
                    matches = re.finditer(pattern, text, re.IGNORECASE)
                    for match in matches:
                        content = match.group(1).strip()
                        extract = LearningExtract(
                            id=self.generate_id(content, video_id),
                            video_id=video_id,
                            timestamp_start=start,
                            timestamp_end=start + 15,
                            title=title,
                            content=content,
                            extract_type=extract_type,
                            topic=self._determine_topic(content),
                            keywords=self._extract_keywords(content),
                            confidence=0.85,
                            related_concepts=self._extract_related_concepts(content),
                            source_link=self.create_source_link(video_id, start)
                        )
                        principles.append(extract)

        return principles

    def extract_warnings(self) -> List[LearningExtract]:
        """Extract warnings and cautions from transcripts."""
        warnings = []

        warning_patterns = [
            (r'(?:warning|caution|beware|avoid|don.t|never)\s+([^.!?]{30,200}[.!?])',
             'warning'),
            (r'(?:mistake|pitfall|trap)\s+(?:to\s+avoid)\s+([^.!?]{30,150}[.!?])',
             'pitfall'),
            (r'(?:common|biggest|worst)\s+(?:problem|issue|challenge)\s+is\s+([^.!?]{30,150}[.!?])',
             'problem'),
        ]

        for trans in self.transcriptions:
            video_id = trans.get('video_id', 'unknown')
            title = self.get_video_title(video_id)
            segments = trans.get('segments', [])

            for segment in segments:
                text = segment.get('text', '')
                start = int(segment.get('start', 0))

                for pattern, extract_type in warning_patterns:
                    matches = re.finditer(pattern, text, re.IGNORECASE)
                    for match in matches:
                        content = match.group(1).strip()
                        extract = LearningExtract(
                            id=self.generate_id(content, video_id),
                            video_id=video_id,
                            timestamp_start=start,
                            timestamp_end=start + 15,
                            title=title,
                            content=content,
                            extract_type=extract_type,
                            topic=self._determine_topic(content),
                            keywords=self._extract_keywords(content),
                            confidence=0.8,
                            related_concepts=self._extract_related_concepts(content),
                            source_link=self.create_source_link(video_id, start)
                        )
                        warnings.append(extract)

        return warnings

    def extract_examples(self) -> List[LearningExtract]:
        """Extract concrete examples from transcripts."""
        examples = []

        example_patterns = [
            (r'(?:for example|for instance|such as|like)\s+([^.!?]{40,200}[.!?])',
             'example'),
            (r'(?:case study|real world|practical example)\s+is\s+([^.!?]{30,150}[.!?])',
             'case_study'),
            (r'(?:demonstrated|showed|example of)\s+([^.!?]{30,150}[.!?])',
             'demonstration'),
        ]

        for trans in self.transcriptions:
            video_id = trans.get('video_id', 'unknown')
            title = self.get_video_title(video_id)
            segments = trans.get('segments', [])

            for segment in segments:
                text = segment.get('text', '')
                start = int(segment.get('start', 0))

                for pattern, extract_type in example_patterns:
                    matches = re.finditer(pattern, text, re.IGNORECASE)
                    for match in matches:
                        content = match.group(1).strip()
                        extract = LearningExtract(
                            id=self.generate_id(content, video_id),
                            video_id=video_id,
                            timestamp_start=start,
                            timestamp_end=start + 20,
                            title=title,
                            content=content,
                            extract_type=extract_type,
                            topic=self._determine_topic(content),
                            keywords=self._extract_keywords(content),
                            confidence=0.75,
                            related_concepts=self._extract_related_concepts(content),
                            source_link=self.create_source_link(video_id, start)
                        )
                        examples.append(extract)

        return examples

    def extract_advice(self) -> List[LearningExtract]:
        """Extract advice and recommendations."""
        advice_list = []

        advice_patterns = [
            (r'(?:advise|recommend|suggest)\s+([^.!?]{30,200}[.!?])',
             'recommendation'),
            (r'(?:should|ought to)\s+(\w+)\s+([^.!?]{20,150}[.!?])',
             'guidance'),
            (r'(?:tip|hack|trick)\s+for\s+([^.!?]{30,150}[.!?])',
             'tip'),
            (r'(?:benefit|advantage|way to)\s+([^.!?]{30,150}[.!?])',
             'benefit'),
        ]

        for trans in self.transcriptions:
            video_id = trans.get('video_id', 'unknown')
            title = self.get_video_title(video_id)
            segments = trans.get('segments', [])

            for segment in segments:
                text = segment.get('text', '')
                start = int(segment.get('start', 0))

                for pattern, extract_type in advice_patterns:
                    matches = re.finditer(pattern, text, re.IGNORECASE)
                    for match in matches:
                        content = match.group(1).strip()
                        extract = LearningExtract(
                            id=self.generate_id(content, video_id),
                            video_id=video_id,
                            timestamp_start=start,
                            timestamp_end=start + 10,
                            title=title,
                            content=content,
                            extract_type=extract_type,
                            topic=self._determine_topic(content),
                            keywords=self._extract_keywords(content),
                            confidence=0.7,
                            related_concepts=self._extract_related_concepts(content),
                            source_link=self.create_source_link(video_id, start)
                        )
                        advice_list.append(extract)

        return advice_list

    def extract_trends(self) -> List[LearningExtract]:
        """Extract trend observations and predictions."""
        trends = []

        trend_patterns = [
            (r'(?:trend|pattern|observation)\s+(?:is|are)\s+([^.!?]{30,200}[.!?])',
             'trend'),
            (r'(?:predict|forecast|expect)\s+([^.!?]{30,150}[.!?])',
             'prediction'),
            (r'(?:growing|increasing|emerging)\s+(?:area|focus|trend)\s+is\s+([^.!?]{30,150}[.!?])',
             'emerging'),
        ]

        for trans in self.transcriptions:
            video_id = trans.get('video_id', 'unknown')
            title = self.get_video_title(video_id)
            segments = trans.get('segments', [])

            for segment in segments:
                text = segment.get('text', '')
                start = int(segment.get('start', 0))

                for pattern, extract_type in trend_patterns:
                    matches = re.finditer(pattern, text, re.IGNORECASE)
                    for match in matches:
                        content = match.group(1).strip()
                        extract = LearningExtract(
                            id=self.generate_id(content, video_id),
                            video_id=video_id,
                            timestamp_start=start,
                            timestamp_end=start + 15,
                            title=title,
                            content=content,
                            extract_type=extract_type,
                            topic=self._determine_topic(content),
                            keywords=self._extract_keywords(content),
                            confidence=0.65,
                            related_concepts=self._extract_related_concepts(content),
                            source_link=self.create_source_link(video_id, start)
                        )
                        trends.append(extract)

        return trends

    def extract_definitions(self) -> List[LearningExtract]:
        """Extract technical term definitions."""
        definitions = []

        def_patterns = [
            (r'(?:definition|define)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:is|means)\s+([^.!?]{30,150}[.!?])',
             'definition'),
            (r'(?:term|concept)\s+(?:called|known as)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+is\s+([^.!?]{30,150}[.!?])',
             'concept'),
        ]

        for trans in self.transcriptions:
            video_id = trans.get('video_id', 'unknown')
            title = self.get_video_title(video_id)
            segments = trans.get('segments', [])

            for segment in segments:
                text = segment.get('text', '')
                start = int(segment.get('start', 0))

                for pattern, extract_type in def_patterns:
                    matches = re.finditer(pattern, text)
                    for match in matches:
                        term = match.group(1).strip()
                        definition = match.group(2).strip()
                        extract = LearningExtract(
                            id=self.generate_id(term, video_id),
                            video_id=video_id,
                            timestamp_start=start,
                            timestamp_end=start + 10,
                            title=title,
                            content=f"{term}: {definition}",
                            extract_type=extract_type,
                            topic='terminology',
                            keywords=[term],
                            confidence=0.95,
                            related_concepts=self._extract_related_concepts(definition),
                            source_link=self.create_source_link(video_id, start)
                        )
                        definitions.append(extract)

        return definitions

    def _determine_topic(self, text: str) -> str:
        """Determine the topic of a piece of content."""
        topics = {
            'deep_learning': ['neural network', 'layer', 'activation', 'backpropagation'],
            'machine_learning': ['model', 'training', 'dataset', 'feature'],
            'ai_safety': ['alignment', 'safety', 'risk', 'control'],
            'nlp': ['language', 'token', 'embedding', 'transformer'],
            'computer_vision': ['image', 'vision', 'detection', 'segmentation'],
            'reinforcement_learning': ['agent', 'reward', 'policy', 'environment'],
            'architecture': ['model', 'design', 'pipeline', 'workflow'],
        }

        text_lower = text.lower()
        for topic, keywords in topics.items():
            if any(kw in text_lower for kw in keywords):
                return topic.replace('_', ' ').title()

        return 'General'

    def _extract_keywords(self, text: str) -> List[str]:
        """Extract important keywords from text."""
        # Common AI/ML keywords
        ai_keywords = [
            'neural network', 'deep learning', 'machine learning', 'AI',
            'model', 'training', 'data', 'algorithm', 'feature',
            'layer', 'activation', 'optimization', 'loss',
            'dataset', 'sample', 'batch', 'epoch', 'learning rate'
        ]

        found_keywords = []
        for kw in ai_keywords:
            if kw.lower() in text.lower():
                found_keywords.append(kw)

        return list(set(found_keywords))[:10]

    def _extract_related_concepts(self, text: str) -> List[str]:
        """Extract related concepts from text."""
        # Map of concept relationships
        concept_map = {
            'neural network': ['deep learning', 'layer', 'activation function'],
            'machine learning': ['supervised', 'unsupervised', 'reinforcement learning'],
            'deep learning': ['neural network', 'backpropagation', 'gradient descent'],
            'transformer': ['attention', 'self-attention', 'token'],
        }

        found = []
        text_lower = text.lower()
        for concept, related in concept_map.items():
            if any(c in text_lower for c in [concept] + related):
                found.extend([c for c in related if c not in found and c.lower() not in text_lower])
                found.append(concept)

        return list(set(found))[:5]

    def extract_all(self) -> List[LearningExtract]:
        """Run all extraction methods and return combined results."""
        all_extracts = []

        print("Extracting principles...")
        all_extracts.extend(self.extract_principles())

        print("Extracting warnings...")
        all_extracts.extend(self.extract_warnings())

        print("Extracting examples...")
        all_extracts.extend(self.extract_examples())

        print("Extracting advice...")
        all_extracts.extend(self.extract_advice())

        print("Extracting trends...")
        all_extracts.extend(self.extract_trends())

        print("Extracting definitions...")
        all_extracts.extend(self.extract_definitions())

        # Deduplicate
        seen = set()
        unique = []
        for extract in all_extracts:
            if extract.id not in seen:
                seen.add(extract.id)
                unique.append(extract)

        self.extracts = unique
        return unique

    def save_to_json(self, output_path: str):
        """Save extracts to JSON file."""
        data = [asdict(ex) for ex in self.extracts]
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"Saved {len(self.extracts)} extracts to {output_path}")

    def search_by_topic(self, topic: str) -> List[LearningExtract]:
        """Search extracts by topic."""
        return [e for e in self.extracts if e.topic.lower() == topic.lower()]

    def search_by_keyword(self, keyword: str) -> List[LearningExtract]:
        """Search extracts by keyword."""
        keyword_lower = keyword.lower()
        return [
            e for e in self.extracts
            if keyword_lower in e.content.lower() or keyword_lower in ' '.join(e.keywords).lower()
        ]

    def get_learning_highlights(self) -> Dict[str, List[Dict]]:
        """Organize extracts by type for display."""
        highlights = defaultdict(list)

        for extract in self.extracts:
            highlights[extract.extract_type].append({
                'id': extract.id,
                'video_id': extract.video_id,
                'timestamp': self.parse_timestamp(extract.timestamp_start),
                'source_link': extract.source_link,
                'content': extract.content[:300] + '...' if len(extract.content) > 300 else extract.content,
                'topic': extract.topic,
                'confidence': round(extract.confidence, 2)
            })

        return dict(highlights)


def main():
    """Main function to run learning extraction."""
    import argparse

    parser = argparse.ArgumentParser(description='AI Exchange Learning Extractor')
    parser.add_argument('--data-dir', default='./data/results',
                       help='Directory containing analysis data')
    parser.add_argument('--output', '-o', default='./data/results/learning_extracts.json',
                       help='Output file for learning extracts')
    parser.add_argument('--search', '-s', help='Search by keyword or topic')
    parser.add_argument('--type', '-t', help='Filter by extract type (principle, warning, example, etc.)')

    args = parser.parse_args()

    extractor = LearningExtractor(args.data_dir)

    if args.search:
        results = extractor.search_by_keyword(args.search)
        print(f"Found {len(results)} matches for '{args.search}':")
        for extract in results[:20]:
            print(f"\n[{extract.timestamp}] {extract.video_id}")
            print(f"  Type: {extract.extract_type} | Topic: {extract.topic}")
            print(f"  Link: {extract.source_link}")
            print(f"  {extract.content[:150]}...")
    else:
        extracts = extractor.extract_all()
        extractor.save_to_json(args.output)

        print(f"\nExtracted {len(extracts)} learning items:")
        highlights = extractor.get_learning_highlights()
        for extract_type, items in highlights.items():
            print(f"  {extract_type}: {len(items)}")


if __name__ == '__main__':
    main()
