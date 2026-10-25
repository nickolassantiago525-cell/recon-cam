RECON CAM V12.4 - ITEM CHECK

Use 1x for a small item instead of ultra-wide. Keep the blade and handle visible,
reduce glare from metal surfaces, center the item, and tap CHECK ITEM.
The standard object model works without the optional large weapon download.

WHAT CHANGED
- Independent tighter crops for tool-like proposals, including toothbrush guesses.
- At most one extra live tool pass every eight seconds.
- CHECK ITEM uses a frozen center crop, two orientations and tool refinements.
- Contradictory tool labels share an uncertain result instead of duplicate boxes.
- People and vehicle detection remain enabled in the ordinary All objects mode.
- Experimental weapon prompts include knife variants and nonweapon lookalikes.

UPDATING THE APP
The current app needs BOTH root index.html and root detection.js.
Do not update only the legacy app.js file. GitHub Pages must finish publishing.
Open the app and confirm the header says V12.4. If an older version remains,
refresh Safari or close and reopen the Home Screen app.

CAMERA PERFORMANCE
Smooth live uses a smaller separate AI canvas. Automatic OCR and the optional
large weapon model remain off by default. Use the top restart button if the
camera freezes. More inference uses battery and may stall older devices.

OPTIONAL WEAPON MODEL
Enable it in Settings, then use SCAN CENTER CLOSE-UP or SCAN WHOLE FRAME.
The main CHECK ITEM button continues using the smaller standard model.
Auto weapon scanning requires its own switch and is resource-intensive.

LIMITS
The supplied green-handled work knife was recognized in one screenshot after
candidate-guided cropping, but another screenshot still failed. No reliability
rate has been established, and live iPhone hardware has not been validated.
Knives may be missed or mislabeled. Scores are not calibrated probabilities.
No detection is not evidence of safety. Do not use this as a security system.
