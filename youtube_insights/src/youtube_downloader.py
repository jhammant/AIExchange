import os
from pathlib import Path
import yt_dlp

def download_videos(config):
    download_dir = Path(config['youtube']['download_dir'])
    os.makedirs(download_dir, exist_ok=True)

    channel_url = config['youtube']['channel_url']
    max_videos = config['youtube'].get('max_videos', 10)

    ydl_opts = {
        'outtmpl': str(download_dir / '%(id)s.%(ext)s'),
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'writethumbnail': True,
        'quiet': False,
        'no_warnings': False,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        # Extract playlist info
        result = ydl.extract_info(channel_url, download=False)
        
        entries = result.get('entries', [])
        if not entries:
            print("No videos found.")
            return

        # Limit to max_videos
        entries = entries[:max_videos]

        for entry in entries:
            video_id = entry.get('id')
            video_title = entry.get('title')
            print(f"Downloading: {video_title} ({video_id})")
            
            # Download video
            ydl.download([video_id])

    print(f"Downloaded {len(entries)} videos to {download_dir}")
