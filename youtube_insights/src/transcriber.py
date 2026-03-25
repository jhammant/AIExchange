import os
import json
from pathlib import Path
import whisper

def transcribe_audio(config):
    download_dir = Path(config['youtube']['download_dir'])
    results_dir = Path(config['output']['results_dir'])
    os.makedirs(results_dir, exist_ok=True)

    model = whisper.load_model(config['transcription']['model_size'])
    device = config['transcription'].get('device', 'cpu')

    transcription_file = results_dir / "transcriptions.json"
    transcriptions = []

    for video_file in download_dir.glob("*.mp4"):
        video_id = video_file.stem
        print(f"Transcribing {video_id}...")

        # Transcribe
        result = model.transcribe(str(video_file), device=device)

        transcriptions.append({
            "video_id": video_id,
            "text": result["text"],
            "segments": result["segments"]
        })

    with open(transcription_file, 'w') as f:
        json.dump(transcriptions, f, indent=4)

    print(f"Transcriptions saved to {transcription_file}")
