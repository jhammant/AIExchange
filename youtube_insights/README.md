# YouTube Insights

A local system to analyze your YouTube channel videos.

## Features
- Download videos from a YouTube channel.
- Scrape video metadata (title, description, views, etc.).
- Transcribe audio to text using Whisper.
- Analyze video frames for objects/images using YOLOv8.

## Setup
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Update `config.yaml` with your YouTube channel URL and preferences.

3. Run the pipeline:
   ```bash
   python main.py
   ```

## Output
Results are saved in `./data/results/`:
- `video_metadata.json`
- `transcriptions.json`
- `image_analysis.json`

## Notes
- Ensure you have enough disk space for video storage and processing.
- For faster transcription, use a GPU by setting `device: "cuda"` in config.yaml (requires PyTorch with CUDA support).
