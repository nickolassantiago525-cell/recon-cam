RECON CAM V12.3 — SMOOTH LIVE CAMERA

WHAT CHANGED
- Camera preview remains a real <video> stream; object recognition analyzes a smaller separate canvas.
- Object recognition scans less often (about every 1–3 seconds after each scan, depending on performance).
- Default camera capture target is 720p / 24fps to reduce load. Optional High detail setting is available.
- Top ↻ button restarts a frozen feed. A frame watchdog tries limited automatic recovery if the browser reports stopped frames.
- Automatic text OCR is OFF at first launch, but tap READ TEXT to scan manually.
- Optional experimental weapon model is NOT loaded automatically. Its AUTO weapon scanning switch is OFF by default to protect live performance. Manual focus scans are available after loading the model.
- Standard object AI can still label knives and scissors without the large optional model.

IPHONE GITHUB UPLOAD
1. Save the included index.html to the iPhone Files app.
2. Open https://github.com/nickolassantiago525-cell/recon-cam in Safari.
3. Replace the existing root index.html in the main branch (not in a subfolder). If GitHub will not overwrite it, delete the old index.html, commit, then Add file > Upload files > select the new index.html and commit.
4. Wait for GitHub Pages to publish. Then open:
   https://nickolassantiago525-cell.github.io/recon-cam/index.html?v=123
5. If an old screen remains, refresh Safari or close and reopen the Home Screen app.

TROUBLESHOOTING
- If the live picture sticks, tap ↻ in the upper-right corner. If it keeps happening, use Settings > Smooth live and turn OFF Auto weapon scans and Automatic text reading.
- A stopped camera can also be caused by Safari/iOS permissions, thermal throttling, low available memory, other camera apps, or browser suspension. Web apps cannot promise uninterrupted operation in the background.
- In this update, normal knife detection remains automatic. The optional, resource-heavy weapon beta must be enabled separately. It can make the feed less responsive, especially on an iPhone.

LIMITS
These features are experimental visual aids. Knives can be confused with scissors, and the optional weapon model's gun labels are unreliable. Failure to draw a box does NOT mean an area is safe.
The application requires HTTPS, permission from Safari/iOS, and an internet connection to load its AI libraries/models unless cached by the browser.

TESTING
V12.3 passed JavaScript syntax checking and a simulated moving-camera test for live frame progress, throttled AI scans, manual restart, and automatic recovery after a stopped stream. It has not been tested on your actual iPhone hardware.
