import os
import json
from pathlib import Path
import cv2
import torch

# Using ultralytics for YOLOv8 (you can replace with CLIP or other models)
from ultralytics import YOLO

def analyze_frames(config):
    download_dir = Path(config['youtube']['download_dir'])
    results_dir = Path(config['output']['results_dir'])
    os.makedirs(results_dir, exist_ok=True)

    detection_model = YOLO(config['image_analysis']['detection_model'])
    frame_sampling_rate = config['image_analysis'].get('frame_sampling_rate', 30)

    image_results_file = results_dir / "image_analysis.json"
    image_results = []

    for video_file in download_dir.glob("*.mp4"):
        video_id = video_file.stem
        print(f"Analyzing frames for {video_id}...")

        cap = cv2.VideoCapture(str(video_file))
        frame_rate = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        detected_objects = []

        frame_idx = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Sample frames based on rate
            if frame_idx % int(frame_rate * frame_sampling_rate) == 0:
                # Run detection
                results = detection_model(frame)

                for r in results:
                    for box in r.boxes:
                        detected_objects.append({
                            "frame": frame_idx,
                            "class": detection_model.names[int(box.cls)],
                            "confidence": float(box.conf),
                            "bbox": box.xyxy[0].tolist()
                        })

            frame_idx += 1

        cap.release()

        image_results.append({
            "video_id": video_id,
            "detected_objects": detected_objects
        })

    with open(image_results_file, 'w') as f:
        json.dump(image_results, f, indent=4)

    print(f"Image analysis results saved to {image_results_file}")
