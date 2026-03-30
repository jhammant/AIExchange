#!/usr/bin/env python3
"""
Flask web application for AI Exchange RAG chatbot.
"""

import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

from engine import QueryEngine

load_dotenv()

app = Flask(__name__, 
            template_folder="templates",
            static_folder="static")

# Load query engine on startup
engine = None

@app.before_request
def initialize_engine():
    """Initialize the query engine on first request."""
    global engine
    if engine is None:
        try:
            engine = QueryEngine()
            print("Query engine initialized successfully")
        except Exception as e:
            print(f"Error initializing query engine: {e}")
            engine = None

@app.route("/")
def index():
    """Render the main chat interface."""
    example_questions = [
        "What are the key trends in enterprise AI adoption?",
        "Which speakers discussed MLOps challenges?",
        "What advice was given about AI team building?"
    ]
    
    return render_template(
        "index.html",
        example_questions=example_questions,
        engine_available=engine is not None
    )

@app.route("/api/query", methods=["POST"])
def query():
    """Handle question queries."""
    if engine is None:
        return jsonify({
            "error": "Query engine not initialized. Did you build the index?",
            "sources": []
        }), 503
    
    try:
        data = request.get_json()
        question = data.get("question", "")
        
        if not question.strip():
            return jsonify({
                "error": "Please provide a question",
                "sources": []
            }), 400
        
        result = engine.answer_question(question)
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            "error": str(e),
            "sources": []
        }), 500

@app.route("/api/index-status", methods=["GET"])
def index_status():
    """Check if the index is built."""
    try:
        db_path = "/Users/jhammant/dev/AIExchange/ask/chromadb"
        import chromadb
        client = chromadb.PersistentClient(path=db_path)
        collection = client.get_or_create_collection(name="ai_exchange_videos")
        
        return jsonify({
            "built": True,
            "chunk_count": collection.count(),
            "status": "ready"
        })
    except Exception as e:
        return jsonify({
            "built": False,
            "error": str(e),
            "status": "not_ready"
        }), 503

@app.route("/api/model-status", methods=["GET"])
def model_status():
    """Check if LLM API is available."""
    lm_studio_url = os.getenv("LM_STUDIO_URL", "http://localhost:1234/v1/chat/completions")
    openrouter_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
    
    if lm_studio_url:
        try:
            import requests
            response = requests.get(f"{lm_studio_url}/models", timeout=5)
            if response.status_code == 200:
                return jsonify({"available": True, "source": "LM Studio"})
        except Exception as e:
            print(f"LM Studio check failed: {e}")
    
    if openrouter_key:
        return jsonify({"available": True, "source": "OpenRouter"})
    
    return jsonify({"available": False})

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    debug = os.getenv("DEBUG", "false").lower() == "true"
    
    print(f"Starting AI Exchange RAG Chatbot on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
