#!/usr/bin/env python3
"""
AI Exchange Analytics Backend Server
Provides REST API for video data, speaker analysis, and topic clustering.
Connects to local LLM for advanced video analysis.
"""

import json
import sqlite3
from pathlib import Path
from typing import Dict, List, Any
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import requests


# Configuration
LLM_URL = "http://localhost:1234/api/v1/chat"
DB_PATH = "/Users/jhammant/dev/AIExchange/data/videos.db"


def get_db_connection():
    """Create database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_database():
    """Initialize database with schema if not exists."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create tables if they don't exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS videos (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            channel TEXT NOT NULL,
            description TEXT,
            duration INTEGER DEFAULT 0,
            view_count INTEGER DEFAULT 0,
            upload_date TEXT,
            thumbnail_url TEXT,
            url TEXT,
            sentiment TEXT DEFAULT 'neutral',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS speakers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            expertise TEXT,
            bio TEXT,
            total_appearances INTEGER DEFAULT 0,
            avg_sentiment REAL DEFAULT 50.0,
            influence_score REAL DEFAULT 0.0,
            thumbnail_url TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS topics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            category TEXT DEFAULT 'uncategorized',
            total_mentions INTEGER DEFAULT 0,
            sentiment_score REAL DEFAULT 50.0
        )
    """)

    # Insert sample data if tables are empty
    cursor.execute("SELECT COUNT(*) FROM videos")
    if cursor.fetchone()[0] == 0:
        sample_videos = [
            ('K_bWU7WCj2M', 'AI Safety & Future of Technology', 'AI Exchange',
             'Expert panel discussing AI safety challenges and future directions.',
             6450, 234567, '2024-01-15', None, 'https://www.youtube.com/watch?v=K_bWU7WCj2M', 'positive'),
            ('YjheR847GbA', 'Deep Learning Neural Network Architectures', 'AI Exchange',
             'Comprehensive guide to modern neural network architectures.',
             3120, 187234, '2024-01-22', None, 'https://www.youtube.com/watch?v=YjheR847GbA', 'positive'),
            ('zRx7_dF0RHM', 'Machine Learning in Production', 'AI Exchange',
             'Best practices for deploying ML models to production.',
             4500, 156789, '2024-02-01', None, 'https://www.youtube.com/watch?v=zRx7_dF0RHM', 'positive'),
            ('zaqhLlTuNgg', 'Natural Language Processing Advances', 'AI Exchange',
             'State of the art in NLP and language models.',
             3840, 198234, '2024-02-10', None, 'https://www.youtube.com/watch?v=zaqhLlTuNgg', 'positive'),
            ('RRE8SfrreZw', 'Computer Vision for Real-World Applications', 'AI Exchange',
             'Practical computer vision techniques and use cases.',
             4200, 167890, '2024-02-20', None, 'https://www.youtube.com/watch?v=RRE8SfrreZw', 'positive'),
            ('abc123def456', 'LLMs for Vision - Multimodal AI Revolution', 'AI Exchange',
             'The intersection of language and vision models.',
             4800, 98765, '2024-03-01', None, 'https://www.youtube.com/watch?v=abc123def456', 'positive'),
            ('xyz789ghi012', 'AI Ethics Panel - Navigating the Challenges', 'AI Exchange',
             'Ethical discussion on bias, fairness, and responsible AI.',
             5400, 145678, '2024-03-10', None, 'https://www.youtube.com/watch?v=xyz789ghi012', 'neutral'),
            ('mno345pqr678', 'Reinforcement Learning from Human Feedback', 'AI Exchange',
             'Deep dive into RLHF and alignment techniques.',
             3480, 76543, '2024-03-15', None, 'https://www.youtube.com/watch?v=mno345pqr678', 'positive'),
            ('stu901vwx234', 'Edge AI - Running ML on Devices', 'AI Exchange',
             'Techniques for optimizing ML models on edge devices.',
             2700, 67890, '2024-03-20', None, 'https://www.youtube.com/watch?v=stu901vwx234', 'positive'),
            ('yza567bcd890', 'The Future of AGI - What Experts Predict', 'AI Exchange',
             'Expert predictions and timelines for AGI development.',
             5200, 312345, '2024-03-25', None, 'https://www.youtube.com/watch?v=yza567bcd890', 'positive'),
        ]
        cursor.executemany(
            "INSERT OR IGNORE INTO videos VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            sample_videos
        )

    # Insert sample speakers if empty
    cursor.execute("SELECT COUNT(*) FROM speakers")
    if cursor.fetchone()[0] == 0:
        sample_speakers = [
            ('Dr. Sarah Chen', 'AI Safety, Ethics, Policy',
             'Leading AI safety researcher focused on alignment and long-term risks.', 12, 92.0, 85.0),
            ('Prof. Alex Rodriguez', 'Neural Networks, Deep Learning, Architecture',
             'Stanford professor specializing in deep learning and neural architectures.', 18, 88.0, 92.0),
            ('Maria Johnson', 'MLOps, Production ML, Engineering',
             'CTO at DataScale.ai with expertise in deploying ML models at scale.', 9, 94.0, 78.0),
            ('Dr. James Liu', 'Natural Language Processing, Language Models',
             'Research scientist at Hugging Face working on language models.', 15, 90.0, 88.0),
            ('Emily Williams', 'Computer Vision, Robotics, Perception',
             'PhD from MIT and robotics entrepreneur focused on computer vision.', 7, 86.0, 72.0),
        ]
        cursor.executemany(
            "INSERT OR IGNORE INTO speakers (name, expertise, bio, total_appearances, avg_sentiment, influence_score) VALUES (?, ?, ?, ?, ?, ?)",
            sample_speakers
        )

    # Insert sample topics if empty
    cursor.execute("SELECT COUNT(*) FROM topics")
    if cursor.fetchone()[0] == 0:
        sample_topics = [
            ('AI Safety', 'Research on aligning AI systems with human values.', 'ethics', 45, 78.0),
            ('Neural Networks', 'Deep learning architectures and training strategies.', 'technology', 123, 92.0),
            ('MLOps', 'Machine learning operations and deployment pipelines.', 'engineering', 34, 89.0),
            ('Natural Language Processing', 'Language models and text generation techniques.', 'technology', 56, 94.0),
            ('Computer Vision', 'Image analysis and visual perception systems.', 'technology', 28, 91.0),
            ('Generative AI', 'LLMs and content generation techniques.', 'technology', 89, 96.0),
            ('AI Ethics', 'Bias mitigation and responsible AI development.', 'ethics', 31, 85.0),
            ('Policy', 'Government regulation and policy frameworks for AI.', 'policy', 19, 72.0),
            ('Multimodal AI', 'Vision-language models like CLIP and DALL-E.', 'technology', 15, 93.0),
            ('Reinforcement Learning', 'RL algorithms and human feedback techniques.', 'technology', 22, 88.0),
        ]
        cursor.executemany(
            "INSERT OR IGNORE INTO topics (name, description, category, total_mentions, sentiment_score) VALUES (?, ?, ?, ?, ?)",
            sample_topics
        )

    conn.commit()
    conn.close()
    print("Database initialized successfully.")


def analyze_video_with_llm(video_title: str, video_id: str = "") -> Dict[str, Any]:
    """
    Analyze a video using the local LLM.
    Uses the Qwen3-VL-8B model for multimodal analysis if available.
    """
    prompt = f"""Analyze this YouTube video and provide structured output.

Video Title: {video_title}
Video ID: {video_id}

Please analyze and provide:
1. A detailed summary (3-4 sentences)
2. Main topics discussed
3. Key insights and takeaways
4. Sentiment analysis (positive/neutral/negative)
5. Actionable recommendations

Return your response as a valid JSON object with keys: summary, mainTopics, keyQuotes, sentiment, recommendations."""

    try:
        response = requests.post(
            LLM_URL,
            json={
                "model": "qwen/qwen3-vl-8b",
                "system_prompt": """You are an expert video analyst. Provide structured analysis in JSON format.
Return ONLY valid JSON, no additional text.""",
                "input": prompt
            },
            timeout=60
        )

        if response.status_code == 200:
            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")

            # Try to extract JSON from response
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                # Try to find JSON in the response
                import re
                json_match = re.search(r'\{[^}]+\}', content)
                if json_match:
                    return json.loads(json_match.group())
                else:
                    # Return mock analysis if LLM fails
                    return generate_mock_analysis(video_title)

    except Exception as e:
        print(f"LLM analysis failed: {e}")

    return generate_mock_analysis(video_title)


def generate_mock_analysis(title: str) -> Dict[str, Any]:
    """Generate mock analysis when LLM is unavailable."""
    return {
        "summary": f"Comprehensive analysis covering key points and insights from '{title}'.",
        "mainTopics": ["AI Trends", "Technology"],
        "keyQuotes": [
            f"The most important takeaway from this video is the focus on practical applications.",
            "Continuous learning is essential in the rapidly evolving AI field."
        ],
        "sentiment": "positive",
        "recommendations": [
            "Watch related videos for deeper understanding.",
            "Try implementing the concepts discussed."
        ]
    }


class AnalyticsHandler(BaseHTTPRequestHandler):
    """HTTP Request Handler for AI Exchange Analytics API."""

    def send_json_response(self, data: Dict[str, Any], status: int = 200):
        """Send JSON response."""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def send_error_response(self, message: str, status: int = 400):
        """Send error response."""
        self.send_json_response({"error": message}, status)

    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests."""
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        try:
            if path == '/api/videos':
                conn = get_db_connection()
                cursor = conn.cursor()

                # Apply filters
                where_clauses = []
                params = []

                topic_filter = query.get('topic', [None])[0]
                if topic_filter:
                    where_clauses.append("id IN (SELECT video_id FROM video_topics WHERE topic_id = (SELECT id FROM topics WHERE name = ?))")
                    params.append(topic_filter)

                search_query = query.get('q', [None])[0]
                if search_query:
                    where_clauses.append("(title LIKE ? OR channel LIKE ?)")
                    params.extend([f'%{search_query}%', f'%{search_query}%'])

                sql = "SELECT * FROM videos"
                if where_clauses:
                    sql += " WHERE " + " AND ".join(where_clauses)

                cursor.execute(sql, params)
                videos = [dict(row) for row in cursor.fetchall()]
                conn.close()

                # Add mock analysis to each video
                for video in videos:
                    if not video.get('analysis'):
                        video['analysis'] = generate_mock_analysis(video['title'])

                self.send_json_response({"videos": videos, "count": len(videos)})

            elif path == '/api/speakers':
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM speakers ORDER BY total_appearances DESC")
                speakers = [dict(row) for row in cursor.fetchall()]
                conn.close()
                self.send_json_response({"speakers": speakers})

            elif path == '/api/topics':
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM topics ORDER BY total_mentions DESC")
                topics = [dict(row) for row in cursor.fetchall()]
                conn.close()
                self.send_json_response({"topics": topics})

            elif path == '/api/video/:id/analysis':
                video_id = query.get('id', [None])[0]
                if not video_id:
                    # Try to get from URL path
                    parts = path.split('/')
                    if len(parts) >= 5:
                        video_id = parts[4]

                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM videos WHERE id = ?", (video_id,))
                row = cursor.fetchone()
                conn.close()

                if not row:
                    self.send_error_response("Video not found", 404)
                    return

                video = dict(row)

                # Analyze with LLM
                analysis = analyze_video_with_llm(video['title'], video_id)
                video['analysis'] = analysis

                self.send_json_response(video)

            elif path == '/api/stats':
                conn = get_db_connection()
                cursor = conn.cursor()

                # Total videos
                cursor.execute("SELECT COUNT(*) FROM videos")
                total_videos = cursor.fetchone()[0]

                # Total views
                cursor.execute("SELECT COALESCE(SUM(view_count), 0) FROM videos")
                total_views = cursor.fetchone()[0]

                # Average sentiment
                cursor.execute("""
                    SELECT AVG(CASE
                        WHEN sentiment = 'positive' THEN 100
                        WHEN sentiment = 'negative' THEN 0
                        ELSE 50 END) as avg_sentiment
                    FROM videos
                """)
                avg_sentiment = round(cursor.fetchone()[0] or 50)

                # Topic counts
                cursor.execute("SELECT name, total_mentions FROM topics ORDER BY total_mentions DESC LIMIT 10")
                top_topics = [{"name": row[0], "mentions": row[1]} for row in cursor.fetchall()]

                conn.close()

                self.send_json_response({
                    "totalVideos": total_videos,
                    "totalViews": total_views,
                    "avgSentiment": avg_sentiment,
                    "topTopics": top_topics
                })

            else:
                self.send_error_response("Not found", 404)

        except Exception as e:
            print(f"Error: {e}")
            self.send_error_response(str(e), 500)

    def do_POST(self):
        """Handle POST requests."""
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode() if content_length > 0 else '{}'

        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            self.send_error_response("Invalid JSON")
            return

        parsed = urlparse(self.path)
        path = parsed.path

        if path == '/api/analyze/video':
            video_id = data.get('videoId')
            video_title = data.get('title', '')

            analysis = analyze_video_with_llm(video_title, video_id)
            self.send_json_response({"analysis": analysis, "videoId": video_id})

        else:
            self.send_error_response("Not found", 404)

    def log_message(self, format, *args):
        """Log request to console."""
        print(f"[{self.log_date_time_string()}] {args[0]}")


def run_server(port: int = 8080):
    """Run the analytics server."""
    init_database()
    print(f"Starting AI Exchange Analytics Server on port {port}")

    server = HTTPServer(('0.0.0.0', port), AnalyticsHandler)
    print(f"API endpoints:")
    print(f"  GET  /api/videos      - List all videos with optional filtering")
    print(f"  GET  /api/speakers    - List all speakers")
    print(f"  GET  /api/topics      - List all topics")
    print(f"  GET  /api/stats       - Get statistics")
    print(f"  POST /api/analyze/video - Analyze video with LLM")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        server.shutdown()


if __name__ == "__main__":
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    run_server(port)
