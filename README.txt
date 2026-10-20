Recon Cam V9 — Wider object categories + Word & Number Reader

Free, static iPhone/Safari web application (GitHub Pages).

New:
- Automatic detection of a larger set of common COCO categories: kitchen utensils including knives, scissors, food, home furniture, signs, electronics, vehicles, people and animals.
- Still does NOT have a validated firearm detector. Never use to confirm that an area/object is safe.
- A "book-like?" label rather than overclaiming a book, e.g. chip packaging.
- Stronger thresholds and repeated detection for people, vehicles and knives.
- Text reader preserves letters and numbers, shows readings as selectable lines below the video.
- SCAN NOW, READ ALOUD, SPELL IT, COPY.
- Masks 12-19-digit card/account-like number strings; OCR remains approximate.
- UI layout adjustments for small iPhone screens.

External model downloads are required for first use (COCO-SSD via TensorFlow.js, Tesseract.js OCR).
Camera / ultrawide camera behavior depends on iOS Safari and hardware.
Includes 8 files in repo root. Version label V9 for deployment verification.
