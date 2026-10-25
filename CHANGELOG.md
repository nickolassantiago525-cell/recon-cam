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
