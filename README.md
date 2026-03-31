# AI Exchange - Advanced Analytics Platform

A comprehensive video analytics platform with AI-powered insights, speaker analysis, and topic clustering. Built for GitHub Pages static hosting.

## Features

### Core Capabilities
- **Advanced Search** - Filter videos by title, channel, topics, and speakers
- **Data Visualization** - Interactive Chart.js charts for views and sentiment analysis
- **Video Analysis** - Integration with local LLM (Qwen3-VL-8B) for video content analysis
- **Speaker Analytics** - Track speaker appearances, sentiment, and influence scores
- **Topic Clustering** - Visualize topic relationships and trends over time

### Key Components
1. **Dashboard** - Overview statistics with animated counters
2. **Video Library** - Searchable database of analyzed videos
3. **Speaker Profiles** - Expert analysis with influence metrics
4. **Topic Tags** - Categorized content connections

## Architecture

```
AI Exchange/
├── index.html          # Main HTML entry point
├── css/
│   └── analytics.css   # DOAC-quality styling
├── js/
│   └── analytics.js    # Client-side logic with Chart.js
└── data/
    └── videos.db       # SQLite database for video metadata
```

## Setup

### GitHub Pages Deployment

1. **Push to repository:**
```bash
git add -A
git commit -m "feat: deploy AI Exchange analytics platform"
git push origin main
```

2. **Enable GitHub Pages:**
   - Go to Repository Settings > Pages
   - Select `main` branch as source

3. **Configure custom domain** (optional):
   - Add CNAME file in repository root
   - Update DNS records

### Local Development

```bash
# Serve static site
npx serve .

# Or use Python HTTP server
python3 -m http.server 8000
```

## LLM Integration

For video analysis, connect to a local LM Studio instance:

```bash
# Start LM Studio server (default: localhost:1234)
curl http://localhost:1234/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen/qwen3-vl-8b",
    "system_prompt": "You are an expert video analyst.",
    "input": "Analyze this video content..."
  }'
```

The platform will automatically attempt to connect and fall back to mock analysis if unavailable.

## Data Structure

### Videos
```json
{
  "id": "video_id",
  "title": "Video Title",
  "channel": "Channel Name",
  "viewCount": 123456,
  "uploadDate": "2024-01-15",
  "sentiment": "positive",
  "topics": ["AI Safety", "Ethics"]
}
```

### Speakers
```json
{
  "name": "Dr. Sarah Chen",
  "expertise": "AI Safety, Ethics",
  "bio": "Leading AI safety researcher...",
  "totalAppearances": 12,
  "avgSentiment": 92.0,
  "influenceScore": 85.0
}
```

### Topics
```json
{
  "name": "Neural Networks",
  "description": "Deep learning architectures...",
  "category": "technology",
  "mentions": 123
}
```

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | HTML5, CSS3, Vanilla JS |
| Charts | Chart.js 4.x |
| Icons | Font Awesome 6.4 |
| Fonts | Google Fonts (Inter) |

## Configuration

Edit `js/analytics.js`:

```javascript
const CONFIG = {
    // LLM URL for video analysis
    llmUrl: 'http://localhost:1234/api/v1/chat',

    // Set to false for production (load from JSON)
    useMockData: true,
};
```

## Analytics Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/videos` | GET | List all videos with optional filter |
| `/api/speakers` | GET | Get speaker database |
| `/api/topics` | GET | Get topic data |
| `/api/stats` | GET | Site statistics |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit with conventional commits format
4. Push and open a pull request

## License

MIT License - see LICENSE file for details.
