RECON CAM V10 - WORD READER UPDATE

This package updates only the index.html file of your existing public GitHub Pages app:
https://github.com/nickolassantiago525-cell/recon-cam

IMPORTANT: It DOES NOT replace the rest of your existing app (app.js, style.css, icons, sw.js, and manifest stay in place).

ON IPHONE:
1. Save the attached index.html file to the Files app. If you downloaded the ZIP, unzip it first.
2. Open the repository above in Safari, signed in to your GitHub account.
3. Tap Add file > Upload files, and select the new index.html from Files.
4. Commit the file to the main branch. You should see index.html marked as replaced/updated.
5. Open https://nickolassantiago525-cell.github.io/recon-cam/?v=10 in Safari.
6. Tap START CAMERA and allow camera access. Under READ WORDS, tap SCAN WORDS. Each detected word is a button you can tap to hear spoken aloud. READ ALL speaks all recognized lines. AUTO VOICE may read new scans automatically.

TIPS:
- To improve accuracy, use a well-lit object and hold the phone steady for a few seconds.
- The OCR library and model may need internet on first use. Do not assume full offline speech/OCR unless the necessary models and voices have actually been cached.
- Browser OCR isn't proof that text, numbers, or objects are present/absent. Do not depend on it for emergencies or weapon identification.
- AUTO VOICE may be limited by Safari's background / non-gesture speech restrictions. Tap READ ALL or an individual word if automatic speech does not start.

Technical: V10 reuses V9 Tesseract OCR results to avoid running a second recognition model on the phone. This update has been syntax-checked but has not been physically tested on an iPhone or deployed to GitHub.
