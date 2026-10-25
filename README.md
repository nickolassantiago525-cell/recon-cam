# Recon Cam V12.4

Browser camera aid for common objects, people and vehicles, with optional
experimental weapon matching. This is not a validated security or safety system.

## Detection improvements

- The standard lightweight COCO detector is retained for live performance.
  A larger general model was not a reliable fix for the reported knife confusion.
- Center-detail passes supplement full-frame and distant-object tiles.
- At most once every eight seconds, a tool-like proposal triggers one tighter
  camera crop and independent inference. This helps small, narrow objects without
  changing a toothbrush label into a knife by rule.
- **CHECK ITEM** freezes a center crop, checks two orientations, and refines up to
  two tool proposals. No large optional weapon download is required.
- Overlapping knife/scissors/toothbrush/utensil alternatives share one uncertain
  track. Temporal conflicts expire; separate nearby objects remain separate.
- Tool labels are qualified, and their model scores are no longer shown as if
  they were calibrated identification probabilities.
- Experimental weapon scans include serrated/bread/folding knife prompts and
  nonweapon lookalikes. Duplicate prompts collapse; a winning nonweapon vetoes a
  weaker weapon result. Near ties are marked uncertain.

## Use

Open over HTTPS and allow camera access. Start at 1× rather than ultra-wide for a
small item, keep the whole blade and handle visible, reduce glare, and tap
**CHECK ITEM**. People and vehicles continue using the live detector.

The optional large weapon model remains opt-in under Settings. After enabling it,
use **SCAN CENTER CLOSE-UP**, **SCAN WHOLE FRAME**, or opt into automatic scans.
The CHECK ITEM button always uses the standard model, even when the optional
model is loaded. A loaded model is not evidence that a scan has run.

## Tests and limitations

Run geometry/conflict/tracking tests with `node --test tests/*.test.cjs`.
Screenshot tests use private local images; user photos are not included here.
The reported green-handled knife can still be missed or misclassified depending
on crop, lighting and angle. These changes are inference and uncertainty handling,
not retraining, and do not establish a detection accuracy rate.

The page actually runs the inline application in `index.html` plus `detection.js`.
The older `app.js` and `style.css` are legacy files, not the current entry point.
Do not replace only `app.js` when updating the current app.
