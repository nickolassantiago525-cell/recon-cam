RECON CAM V11 - FULL SCREEN AUTO UPGRADE

This ZIP contains ONLY THE THREE FILES THAT NEED REPLACING in your existing GitHub repo.
Keep your existing app.js, style.css, icons and other files.

FROM IPHONE:
1. Open https://github.com/nickolassantiago525-cell/recon-cam in Safari.
2. Download this ZIP in ChatGPT, open Files and tap it to unzip.
3. Open the repository in GitHub, upload/replace index.html, manifest.webmanifest and sw.js at the repository root (main branch). GitHub may require you to use its Add file -> Upload files interface and to commit.
4. Open https://nickolassantiago525-cell.github.io/recon-cam/?v=11 in Safari.
5. For edge-to-edge Home Screen view, use Safari Share > Add to Home Screen > Open as Web App, if shown.

NEW:
- The camera fills the full iPhone screen.
- It requests camera access automatically at page launch. If iOS refuses, tap START CAMERA.
- Automatic object detection with readable green boxes (default strict mode).
- Automatic word/number recognition (results stay in the small bottom panel).
- Simple floating zoom buttons and a hamburger menu for the rest of the controls.
- Tap-to-read individual words, manual spelling and optional automatic speech.

LIMITS:
- iOS/Safari may ask for camera permission at each app start. Code cannot override this.
- 0.5x works only if Safari exposes the iPhone ultra-wide camera.
- AI recognizes only its trained classes, may hallucinate labels, and is NOT a reliable weapon or safety detector.
- AI model libraries may need network access, especially on the first load.
- The app cannot use the camera while backgrounded or phone locked.
- It has not been tested on your physical iPhone; report any errors with a screenshot.
