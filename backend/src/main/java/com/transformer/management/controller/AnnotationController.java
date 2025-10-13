package com.transformer.management.controller;

import com.transformer.management.dto.AnnotationDTO;
import com.transformer.management.dto.SaveAnnotationsRequest;
import com.transformer.management.entity.Annotation;
import com.transformer.management.entity.AnomalyDetection;
import com.transformer.management.entity.Image;
import com.transformer.management.repository.AnnotationRepository;
import com.transformer.management.repository.AnomalyDetectionRepository;
import com.transformer.management.repository.ImageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST Controller for annotation operations
 * Supports Phase 3 Interactive Annotation & Feedback
 */
@RestController
@RequestMapping("/annotations")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class AnnotationController {
    private static final Logger logger = LoggerFactory.getLogger(AnnotationController.class);

    @Autowired
    private AnnotationRepository annotationRepository;

    @Autowired
    private ImageRepository imageRepository;

    @Autowired
    private AnomalyDetectionRepository anomalyDetectionRepository;

    /**
     * Save annotation updates from the frontend
     * POST /api/annotations/save
     * 
     * @param request The save annotations request containing image ID and annotations
     * @return The saved annotations
     */
    @PostMapping("/save")
    public ResponseEntity<?> saveAnnotations(@RequestBody SaveAnnotationsRequest request) {
        logger.info("Received save annotations request for image: {}", request.getImageId());
        
        if (request.getImageId() == null || request.getAnnotations() == null) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Image ID and annotations are required"));
        }

        try {
            UUID imageId = UUID.fromString(request.getImageId());
            
            // Verify image exists
            Image image = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found: " + imageId));

            List<Annotation> savedAnnotations = new ArrayList<>();

            for (AnnotationDTO dto : request.getAnnotations()) {
                Annotation annotation;

                if (dto.getId() != null) {
                    // Update existing annotation
                    annotation = annotationRepository.findById(dto.getId())
                        .orElse(new Annotation());
                    
                    if ("deleted".equalsIgnoreCase(dto.getAction())) {
                        // Mark as deleted instead of actually deleting
                        annotation.setIsDeleted(true);
                        annotation.setDeletedAt(LocalDateTime.now());
                        logger.info("Marking annotation {} as deleted", dto.getId());
                    } else {
                        // Update coordinates and metadata
                        annotation.setBboxX(dto.getX());
                        annotation.setBboxY(dto.getY());
                        annotation.setBboxWidth(dto.getWidth());
                        annotation.setBboxHeight(dto.getHeight());
                        annotation.setLabel(dto.getLabel());
                        annotation.setConfidence(dto.getConfidence());
                        annotation.setAction(dto.getAction());
                        annotation.setNotes(dto.getNotes());
                        annotation.setAnnotationType("USER_EDITED");
                        logger.info("Updating annotation {} with action: {}", dto.getId(), dto.getAction());
                    }
                } else {
                    // Create new annotation
                    annotation = new Annotation();
                    annotation.setImage(image);
                    annotation.setUserId(request.getUserId() != null ? request.getUserId() : "unknown");
                    annotation.setBboxX(dto.getX());
                    annotation.setBboxY(dto.getY());
                    annotation.setBboxWidth(dto.getWidth());
                    annotation.setBboxHeight(dto.getHeight());
                    annotation.setLabel(dto.getLabel() != null ? dto.getLabel() : "Unknown");
                    annotation.setConfidence(dto.getConfidence());
                    annotation.setAction(dto.getAction() != null ? dto.getAction() : "added");
                    annotation.setNotes(dto.getNotes());
                    annotation.setAnnotationType("USER_CREATED");
                    logger.info("Creating new annotation with action: {}", annotation.getAction());
                }

                savedAnnotations.add(annotationRepository.save(annotation));
            }

            logger.info("Successfully saved {} annotations for image {}", savedAnnotations.size(), imageId);

            // Convert to DTOs for response
            List<AnnotationDTO> responseDTOs = savedAnnotations.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                "message", "Annotations saved successfully",
                "count", savedAnnotations.size(),
                "annotations", responseDTOs
            ));

        } catch (IllegalArgumentException e) {
            logger.error("Invalid image ID format: {}", request.getImageId());
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Invalid image ID format"));
        } catch (Exception e) {
            logger.error("Error saving annotations: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to save annotations", "message", e.getMessage()));
        }
    }

    /**
     * Get annotations for a specific image
     * GET /api/annotations/image/{imageId}
     * 
     * @param imageId The image ID
     * @return List of annotations for the image
     */
    @GetMapping("/image/{imageId}")
    public ResponseEntity<?> getAnnotationsByImage(@PathVariable String imageId) {
        logger.info("Fetching annotations for image: {}", imageId);

        try {
            UUID id = UUID.fromString(imageId);
            List<Annotation> annotations = annotationRepository.findActiveAnnotationsByImageId(id);

            List<AnnotationDTO> dtos = annotations.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

            return ResponseEntity.ok(dtos);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Invalid image ID format"));
        } catch (Exception e) {
            logger.error("Error fetching annotations: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to fetch annotations"));
        }
    }

    /**
     * Get annotations for a specific anomaly detection
     * GET /api/annotations/detection/{detectionId}
     * 
     * @param detectionId The anomaly detection ID
     * @return List of annotations for the detection
     */
    @GetMapping("/detection/{detectionId}")
    public ResponseEntity<?> getAnnotationsByDetection(@PathVariable String detectionId) {
        logger.info("Fetching annotations for detection: {}", detectionId);

        try {
            UUID id = UUID.fromString(detectionId);
            List<Annotation> annotations = annotationRepository.findByAnomalyDetectionId(id);

            List<AnnotationDTO> dtos = annotations.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

            return ResponseEntity.ok(dtos);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Invalid detection ID format"));
        } catch (Exception e) {
            logger.error("Error fetching annotations: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to fetch annotations"));
        }
    }

    /**
     * Delete an annotation
     * DELETE /api/annotations/{annotationId}
     * 
     * @param annotationId The annotation ID to delete
     * @return Success response
     */
    @DeleteMapping("/{annotationId}")
    public ResponseEntity<?> deleteAnnotation(@PathVariable String annotationId) {
        logger.info("Deleting annotation: {}", annotationId);

        try {
            UUID id = UUID.fromString(annotationId);
            Annotation annotation = annotationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Annotation not found"));

            // Soft delete
            annotation.setIsDeleted(true);
            annotation.setDeletedAt(LocalDateTime.now());
            annotationRepository.save(annotation);

            return ResponseEntity.ok(Map.of("message", "Annotation deleted successfully"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Invalid annotation ID format"));
        } catch (Exception e) {
            logger.error("Error deleting annotation: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to delete annotation"));
        }
    }

    /**
     * Convert Annotation entity to DTO
     */
    private AnnotationDTO convertToDTO(Annotation annotation) {
        AnnotationDTO dto = new AnnotationDTO();
        dto.setId(annotation.getId());
        dto.setX(annotation.getBboxX());
        dto.setY(annotation.getBboxY());
        dto.setWidth(annotation.getBboxWidth());
        dto.setHeight(annotation.getBboxHeight());
        dto.setLabel(annotation.getLabel());
        dto.setConfidence(annotation.getConfidence());
        dto.setAction(annotation.getAction());
        dto.setAnnotationType(annotation.getAnnotationType());
        dto.setNotes(annotation.getNotes());
        dto.setUserId(annotation.getUserId());
        dto.setTimestamp(annotation.getCreatedAt());
        dto.setOriginalDetectionId(annotation.getOriginalDetectionId());
        return dto;
    }
}
