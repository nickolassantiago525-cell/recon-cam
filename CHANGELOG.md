# Recon Cam V12.6

## Expanded experimental recognition

- Added seven extended prompt groups using the existing optional OWL-ViT model:
  wildlife/rodents, reptiles, pets/animals, bird types, people/vehicles,
  possible weapons and additional everyday objects.
- Added up to eight custom text prompts, DEEP SCAN, group-by-group rotation,
  opt-in periodic scanning and category filters shared by both detection paths.
- Qualified all extended matches as possible or uncertain; stronger lookalike
  results suppress overlapping positives. Standard mouse labels now explicitly
  read Computer mouse rather than implying an animal.
- The lightweight model's class coverage is documented in the
  [TensorFlow class list](https://raw.githubusercontent.com/tensorflow/tfjs-models/master/coco-ssd/src/classes.ts).
  Text-prompted boxes use the documented
  [Transformers.js zero-shot detection interface](https://huggingface.co/docs/transformers.js/api/pipelines).
  Prompt availability is not proof of species, breed or firearm accuracy.

## Camera startup and permission repair

- Added opaque-origin/Permissions Policy preflight and clear preview-blocked help.
- Added ENABLE CAMERA buttons and browser-owned permission status. Retained
  automatic startup, which may reuse a permission grant if the browser permits it.
- Added constrained-camera TypeError fallback, cleanup of partial startup and
  safe handling when optional track capabilities throw.
- Permission denial is never silently retried. No code auto-approves browser or
  OS permission or promises that approval is permanent.
- On iPhone, the saved choice is controlled by Safari's per-site Camera setting:
  [Apple instructions](https://support.apple.com/guide/iphone/browse-the-web-privately-iphb01fc3c85/ios).
  Embedded-camera restrictions are documented by
  [MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).

## Verification and remaining limitations

- Unit tests cover existing recognition geometry, camera failures/fallbacks and
  all prompt groups, including computer-mouse disambiguation and lookalike veto.
- Browser integration uses a simulated camera and explicitly mocked extended
  model. It proves requests, grouping, filtering, rotation and rendering, not
  actual animal/breed/weapon recognition accuracy.
- The user's real iPhone camera and all requested species/types remain unvalidated.
- A blocked embedded preview cannot be repaired by camera-request JavaScript.
  Standalone hosting is required there; publication awaits user approval.

# Recon Cam V12.5

## Machine vision presentation

- Default red machine-vision camera appearance, scanlines, low-motion scan sweep,
  optical reticle, corner frame and bracket-style object tracking.
- HUD reads actual camera resolution, clock, displayed track labels and count.
  Offline and unavailable-model states never invent detections.
- All existing picture appearances remain available in Camera settings.
- Original video remains the inference source; recognition models and tracking
  thresholds are unchanged. This is not infrared, thermal vision or identity recognition.
- Photo downloads retain the selected color filter; machine-vision photos also
  include scanlines, reticle and compact real status readouts.
- Updated installation manifest and added presentation regression tests.

## Verification

All 24 unit tests passed, including existing geometry/conflict/tracking cases.
Desktop 1280x800, mobile 375x812 and short landscape controls were checked.
Simulated-camera/model fixtures exercised view switching, far scan, zoom,
text-dock switching, item check, photo download, target filters, sensitivity,
stop/start and restart. No uncaught page errors were observed.
No-camera handling, reduced-motion rendering and normal-view fallback were checked.
Physical camera performance and real-world recognition on iPhone remain unverified.

# Recon Cam V12.4

## Changed

- Added independent candidate-guided tool crops, limited to one extra live pass
  every eight seconds when a tool proposal exists.
- Added CHECK ITEM using a frozen center crop, two orientations and up to two
  candidate-guided refinements, without loading the optional weapon model.
- Reconciled same-object utensil/knife/toothbrush/scissors conflicts into qualified
  uncertain labels. Tool scores are no longer displayed as identification odds.
- Preserved ordinary people/vehicle detection and lightweight camera scheduling.
- Added knife-specific experimental prompts, nonweapon comparison prompts,
  same-object prompt deduplication and nonweapon-winner suppression.
- Added geometry, conflict and experimental candidate tests.

## Evidence and limits

The supplied work-knife screenshot was cropped locally to remove the app UI.
On that camera-region crop, the existing lightweight model proposed toothbrush
at approximately 0.45. A crop generated from that proposal produced knife at
approximately 0.65 using the same model. The second work-knife screenshot still
failed to produce a displayable knife result. A manually chosen close crop of
the first screenshot produced a stronger knife score, but that is not evidence
of automatic pipeline accuracy.

The complete CHECK ITEM flow was also exercised with the camera region placed
back into a portrait-sized simulated camera stream. In that replay it returned
Possible knife at a raw model score of approximately 0.85. The visible box was
checked in the mobile layout. All 21 geometry/conflict/tracking tests passed.
Camera, zoom, target filters, sensitivity, picture effects, OCR, speech controls,
photo download, optional model controls and restart paths were checked with
simulated camera/model fixtures. The app produced no uncaught page errors in
those checks. Fixture results do not establish real-world detection accuracy.

These scores are raw model outputs, not calibrated probabilities. Screenshot
checks are not an accuracy benchmark or live-iPhone validation. No user image
is committed with this update. No new trained weights are included.
