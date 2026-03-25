import os
import json
from pathlib import Path
import yt_dlp

def scrape_video_metadata(config):
    download_dir = Path(config['youtube']['download_dir'])
    results_dir = Path(config['output']['results_dir'])
    os.makedirs(results_dir, exist_ok=True)

    metadata_file = results_dir / "video_metadata.json"
    metadata_list = []

    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,  # Get full info
    }

    for video_file in download_dir.glob("*.mp4"):
        video_id = video_file.stem
        print(f"Scraping metadata for {video_id}...")

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)

            metadata = {
                "id": info.get("id"),
                "title": info.get("title"),
                "description": info.get("description"),
                "duration": info.get("duration"),
                "view_count": info.get("view_count"),
                "upload_date": info.get("upload_date"),
                "author": info.get("uploader"),
            }
            metadata_list.append(metadata)

    with open(metadata_file, 'w') as f:
        json.dump(metadata_list, f, indent=4)

    print(f"Metadata saved to {metadata_file}")
