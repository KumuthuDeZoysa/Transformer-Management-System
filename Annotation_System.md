# Phase 3 — Interactive Annotation & Feedback

This document describes Phase 3 of the Transformer Management System (Interactive Annotation & Feedback). It summarizes the annotation features added to the frontend, how annotations and feedback are persisted on the backend.

## Description of the annotation system

The annotation system enables human-in-the-loop review of AI-generated anomaly detections on thermal images. Main UX features:

- Side-by-side baseline and maintenance images with pan & zoom controls.
- Automated anomaly detection via the existing AI model (detectAnomalies). AI detections are loaded as bounding boxes.
- Interactive annotation editor (CanvasAnnotationEditor) shown after analysis. It supports:
  - Moving/resizing bounding boxes
  - Deleting AI detections (move to Deleted list)
  - Adding new bounding boxes (user-created)
  - Adding or editing textual notes for each annotation
  - Selecting an annotation from the list to focus it in the editor
- Annotation metadata captured for each box:
  - action: added | edited | deleted | confirmed
  - annotationType: AI_GENERATED | USER_CREATED | USER_EDITED
  - label, confidence, severity, color
  - notes (optional free-text)
  - timestamp, lastModified
  - userId of the annotator
  - modificationTypes and modificationDetails (history hints)

Frontend integration points:

- `components/anomaly-viewer.tsx` orchestrates detection, annotation editor display, and saving logic.
- `components/canvas-annotation-editor.tsx` implements the drawing/resizing/moving/deleting UI and emits real-time box updates to the parent.
- `lib/annotation-api.ts` provides helper functions used by the UI to save and load annotations.
- `hooks/use-feedback-log.ts` is a helper hook to submit feedback logs (original model predictions vs final annotations) to the API for downstream model improvement.

How users interact:

1. Click "Detect Anomalies" to run the AI model on the maintenance image.
2. AI predictions appear as editable bounding boxes in the CanvasAnnotationEditor.
3. The user adjusts, deletes, or adds annotations. For any box the user can add notes.
4. Click "Save Changes" to persist all annotations and generate a feedback log comparing model predictions with final annotations.

## Backend structure used to persist annotations

The backend uses a dedicated controller and repository for inspection annotations. Key components:

- Controller: `backend/src/main/java/com/transformer/management/controller/InspectionAnnotationController.java`
  - Base route: `/inspection-annotations`
  - POST `/inspection-annotations/save` — Saves ALL annotations for an inspection (image). The controller replaces existing annotations for that inspection with the submitted set. When saving it:
    - Deletes existing annotations for the inspection to ensure a clean state.
    - Saves new annotations with deterministic UUIDs. This ensures reproducible IDs.
    - Persists metadata fields: inspectionId, transformerId, userId, bbox fields (x, y, width, height), label, confidence, severity, action, isAI, notes, lastModified, modificationTypes, modificationDetails, deleted flags and timestamps.
  - GET `/inspection-annotations/{inspectionId}` — Returns all annotations for an inspection (including deleted ones). The frontend separates active and deleted annotations by checking `action` or `isDeleted`.
  - DELETE `/inspection-annotations/{inspectionId}` — Deletes all annotations for that inspection (useful when rerunning detection).
  - GET `/inspection-annotations/{inspectionId}/exists` — Lightweight existence/count check.

- DTOs and request shapes (frontend mirrors these in `lib/annotation-api.ts` and `lib/types.ts`):
  - AnnotationDTO: id, x, y, width, height, label, confidence, severity, action, annotationType, notes, userId, timestamp, lastModified, modificationTypes, modificationDetails, isAI, originalDetectionId, imageId, transformerId
  - SaveAnnotationsRequest: imageId, userId, timestamp, annotations[]

- Persistence layer: `InspectionAnnotationRepository` (Spring Data repository) stores entities in the `inspection_annotations` table or equivalent entity `InspectionAnnotation`.

Feedback logging

- The frontend assembles a feedback log (original model predictions + final annotations + annotator metadata) and calls a feedback API endpoint via `hooks/use-feedback-log.ts` (POST `/api/feedback/log` on the Next.js side which proxies to the backend). The exact backend feedback controller is part of the backend service and stores feedback logs for downstream export and model retraining.

Exporting logs

- The feedback log contains the following for export (JSON/CSV):
  - imageId
  - model_predicted_anomalies (ModelPredictions structure)
  - final_accepted_annotations (FinalAnnotations structure)
  - annotator_metadata (AnnotatorMetadata)
  - created_at (timestamp)

The frontend provides hooks to submit logs and the backend persists feedback records for later export. The `lib/types.ts` file documents the shapes used.

## Known bugs & limitations

The following are known limitations and areas that should be revisited in future work:

1. Atomic updates: the current `/inspection-annotations/save` endpoint deletes existing annotations for an inspection before inserting the new set. This means concurrent edits by multiple users may clobber each other's changes.

2. No version history UI: previous versions of annotated images and their diffs are not stored in the UI (out of scope). The backend does capture `lastModified`, but there is no UI to browse or revert to older annotation versions.

3. Limited shapes: current editor focuses on rectangular bounding boxes.


## Where to look in the code

- Frontend
  - `components/anomaly-viewer.tsx` — Main orchestrator for detection, annotation editing and saving.
  - `components/canvas-annotation-editor.tsx` — Interactive canvas/editor (drawing, moving, resizing, deleting).
  - `lib/annotation-api.ts` — Client helpers: `saveAnnotationsRealtime`, `getInspectionAnnotations`, `saveAnnotations`, `deleteAnnotation`.
  - `hooks/use-feedback-log.ts` — Submits feedback logs (POST `/api/feedback/log`).
  - `lib/types.ts` — Shared TS interfaces used across UI and API calls.

- Backend (Java / Spring Boot)
  - `backend/src/main/java/com/transformer/management/controller/InspectionAnnotationController.java` — Save / Get / Delete annotations endpoints.
  - `backend/src/main/java/com/transformer/management/entity/InspectionAnnotation.java` — Entity mapping for persisted annotations.
  - `backend/src/main/java/com/transformer/management/repository/InspectionAnnotationRepository.java` — Spring Data repository.
