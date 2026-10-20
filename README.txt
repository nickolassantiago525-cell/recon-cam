Recon Cam V8 — Clear Labels + Smart Text Reader

What's new:
- Keeps object name + confidence labels (such as Bottle 59%).
- Text/letters/numbers are shown in a separate readable panel BELOW the camera instead of dozens of overlapping blue labels.
- OCR filters low-confidence text and shows up to three lines. Can be paused independently.
- A strict detection option raises confidence thresholds and waits for repeated matches before showing object labels, especially people and vehicles.
- Strong colored boxes remain over the live, normally colored camera.
- Actual ultra-wide camera is requested only when Safari exposes an identifiable ultra-wide device. 0.5x is not simulated by a CSS scale.

Limitations:
- Even repeated high-confidence predictions can be wrong. Object detections are NOT proof a person or car exists.
- OCR still occasionally misreads signs; low-confidence results are hidden.
- Coco-SSD doesn't identify weapons, coins, cash, cards, doors and many tiny objects reliably.
- Thermal and night view are visual effects only, not heat/night sensors.
- Free CDN-based AI download requires internet; camera itself is not dependent on AI.

Upload all eight files to GitHub repo root, overriding V7, enable Pages from main root (existing setup remains).
