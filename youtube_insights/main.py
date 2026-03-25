import os
import yaml
from pathlib import Path

from src.youtube_downloader import download_videos
from src.metadata_scraper import scrape_video_metadata
from src.transcriber import transcribe_audio
from src.image_analyzer import analyze_frames

def load_config(config_path="config.yaml"):
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

def main():
    config = load_config()

    # 1. Download videos
    print("Downloading videos...")
    download_videos(config)

    # 2. Scrape metadata (titles, descriptions)
    print("Scraping video metadata...")
    scrape_video_metadata(config)

    # 3. Transcribe audio
    print("Transcribing audio...")
    transcribe_audio(config)

    # 4. Analyze images
    print("Analyzing video frames...")
    analyze_frames(config)

    print("Analysis complete. Results saved to ./data/results")

if __name__ == "__main__":
    main()
