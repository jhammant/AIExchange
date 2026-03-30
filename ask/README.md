# AI Exchange RAG Chatbot

A Retrieval-Augmented Generation (RAG) chatbot for the AI Exchange video library. Ask questions about AI conference talks and get answers grounded in actual transcripts with citations and YouTube timestamp links.

## Architecture

This project implements a complete RAG system:

1. **Embedding Pipeline** (`build_index.py`): Processes transcripts and analyses, chunks them into ~500 token segments with metadata (video ID, speaker, timestamp estimate), generates embeddings using `all-MiniLM-L6-v2`, and stores in ChromaDB.

2. **Query Engine** (`engine.py`): Embeds user questions, retrieves top-8 relevant chunks from ChromaDB, builds context-aware prompts, and calls LM Studio or OpenRouter APIs.

3. **Web UI** (`app.py`): Flask-based interactive chat interface with example questions, source citations, and YouTube links.

4. **Static Export** (`static/index.html`): Self-contained static version that runs entirely in the browser for cheap hosting (e.g., GitHub Pages).

## Quick Start

### 1. Install Dependencies

```bash
cd /Users/jhammant/dev/AIExchange/ask
pip install -r requirements.txt
```

### 2. Build the Embedding Index

This processes all transcripts and analyses, chunks them into overlapping segments with metadata, generates embeddings using sentence-transformers (all-MiniLM-L6-v2), and stores in ChromaDB:

```bash
python build_index.py
```

This will:
- Load video metadata from the SQLite database  
- Process each transcript and analysis file
- Create ~500 token overlapping chunks with metadata (video ID, timestamp estimate)
- Generate embeddings using sentence-transformers (all-MiniLM-L6-v2 - fast, local)
- Store everything in ChromaDB (file-based database)

### 3. Configure API Access

Set up one of the following:

**Option A: LM Studio (local - free)**
1. Download and install [LM Studio](https://lmstudio.ai/)
2. Start the local server (default: `http://localhost:1234`)
3. Load a model (e.g., Llama-3, Mistral)

**Option B: OpenRouter API**
1. Get your free API key from [openrouter.ai](https://openrouter.ai)
2. Set the environment variable:

```bash
export OPENROUTER_API_KEY="your-api-key-here"
```

Or create a `.env` file:

```bash
OPENROUTER_API_KEY=sk-...
```

### 4. Run the Web Server

```bash
python app.py
```

The server starts on `http://localhost:8080`. Open the URL in your browser.

## Usage

### Web Interface

1. Open http://localhost:8080 in your browser
2. Type a question (e.g., "What are the key trends in enterprise AI adoption?")
3. Press Enter or click Send
4. View the AI-generated answer with citations and YouTube links

### Terminal API

```bash
python engine.py "What are the key trends in enterprise AI adoption?"
```

## Example Questions

Try these questions to test the system:

- "What are the key trends in enterprise AI adoption?"
- "Which speakers discussed MLOps challenges?"
- "What advice was given about AI team building?"
- "How do companies handle observability for mission-critical systems?"

## File Structure

```
ask/
├── build_index.py      # Embedding pipeline script
├── engine.py           # Query engine (retrieval + LLM)  
├── app.py              # Flask web application
├── requirements.txt    # Python dependencies
├── README.md           # This file
│
├── templates/
│   └── index.html      # Main chat interface template
│
└── static/
    └── index.html      # Self-contained static version (for GitHub Pages)
```

## Deploying the Static Version

The static version (`static/index.html`) can be hosted anywhere without any backend:

### GitHub Pages

1. Commit the `static/` directory to your repository
2. Go to GitHub repository Settings → Pages
3. Select `main` branch and `/static/` folder
4. Save

### Netlify / Vercel

Drag and drop the `static/` folder onto their deploy interface.

### Local Hosting

```bash
cd static/
python3 -m http.server 8000
```

**Note:** The static version requires an API key (OpenRouter) since it cannot access the local database.

## Data Sources

The system reads from:
- **Transcripts**: `/video-analysis/transcripts/` (101 `.txt` files)
- **Analyses**: `/video-analysis/analysis/structured/` (101 `.json` files)  
- ** Metadata**: `/video-analysis/database/videos.db` (SQLite)

Each video includes title, channel, duration, URL, summary, topics, and quotes from the talk.

## Configuration

### Environment Variables

```bash
# API Configuration
export LM_STUDIO_URL="http://localhost:1234/v1/chat/completions"
export OPENROUTER_API_KEY="sk-..."

# Server Configuration
export PORT=8080
export DEBUG=false
```

### ChromaDB Location

The database is stored at: `/ask/chromadb/`

Rebuild the index by deleting this directory and running `build_index.py` again.

## API

### Query Endpoint

```bash
curl -X POST http://localhost:8080/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the key trends?"}'
```

**Response:**
```json
{
  "question": "...",
  "answer": "...",
  "sources": [
    {
      "video_id": "_tHHzkkvgHc",
      "title": "Beyond LLMOps...",
      "channel": "The Exchange", 
      "timestamp": "12:34",
      "youtube_url": "https://youtu.be/_tHHzkkvgHc?t=754",
      "relevance_score": 0.87
    }
  ],
  "retrieved_chunks": 8
}
```

### Model Status Endpoint

```bash
curl http://localhost:8080/api/model-status
```

### Index Status Endpoint

```bash
curl http://localhost:8080/api/index-status
```

## Troubleshooting

### Embeddings not building
- Check that transcripts exist in `/video-analysis/transcripts/`
- Ensure analyses are in `/video-analysis/analysis/structured/`

### API errors
- Verify LM Studio is running at the configured URL  
- Check your OpenRouter API key is valid
- Ensure you have internet connection for external APIs

### Port already in use
```bash
export PORT=8081  # Use a different port
```

## Performance

- **Index Building**: ~2-5 minutes (generates 1000+ chunks)
- **Query Time**: ~2-5 seconds (retrieval + LLM generation)  
- **Index Size**: ~100MB for 101 videos

## License

MIT

## Testing

### JavaScript Tests (Vitest)

Run all tests:
```bash
npm test
```

Run with coverage:
```bash
npm run coverage
```

### Python Tests (pytest)

Install pytest-cov:
```bash
pip install pytest-cov
```

Run tests with coverage:
```bash
cd /Users/jhammant/dev/AIExchange/ask/tests
python3 test_citation.py
```

Run with HTML coverage report:
```bash
python3 -m pytest test_citation.py --cov=. --cov-report=html
open htmlcov/index.html
```

### Test Coverage

Target: **80%+ coverage**

Test suites:
- `test/engine.test.js` - 18 tests for citation extraction, YouTube link parsing
- `tests/test_citation.py` - 12 tests for chunking, token counting

## License
MIT
