RECON CAM V12 — iPHONE INSTALL (ONE-FILE REPLACEMENT)

Only replace index.html in your existing GitHub repo.

1. Open https://github.com/nickolassantiago525-cell/recon-cam in Safari.
2. Tap index.html, tap the pencil/Edit icon.
3. It may be easier to delete the old index.html using the file menu and then use Add file > Upload files to upload the new index.html from your iPhone Files app. If the existing file remains, editing it with the new file's complete content is also possible. Do NOT create index(1).html.
4. Commit directly to main (save changes).
5. Open https://nickolassantiago525-cell.github.io/recon-cam/?v=12 in Safari. If the old V11 remains, close the Home Screen app, reload Safari, and open ?v=12 again.

V12 contains the full UI/JS/CSS in a single index.html. Existing CSS and app.js files can remain; V12 does not load them. The old service worker is unregistered to avoid stale versions.

Object detection: COCO-SSD (standard model, loaded from CDN). Far mode scans smaller frame tiles to improve some small object detection. Detection remains fallible; it does not identify individual people.

Knife detection: COCO has a knife category, but may miss knives or mistake other objects. Firearms are NOT supported by COCO.

EXPERIMENTAL WEAPON SCANNER: Optional OWL-ViT via Transformers.js/Hugging Face, only after pressing ENABLE. This is a very large download and can exceed iPhone memory / fail. It attempts *possible* handgun, rifle, knife, and scissors recognition but is unvalidated; never treat as a safety system. If it fails, ordinary object detection still works.

Camera permission must be controlled by Safari/iOS. No website can grant itself permanent camera access. Genuine 0.5x works only if Safari exposes an ultra-wide device; digital zoom cannot widen the field of view. Brightening/thermal styles are effects, not real night/thermal sensors.

Model files may need internet the first time (and later if caches are cleared); V12 is not guaranteed to work offline. This is a prototype, not professional surveillance/security equipment.
