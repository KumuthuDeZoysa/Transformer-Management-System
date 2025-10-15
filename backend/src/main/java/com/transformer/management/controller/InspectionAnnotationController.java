package com.transformer.management.controller;

import com.transformer.management.dto.AnnotationDTO;
import com.transformer.management.dto.SaveAnnotationsRequest;
import com.transformer.management.entity.InspectionAnnotation;
import com.transformer.management.repository.InspectionAnnotationRepository;
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
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.stream.Collectors;

/**
 * REST Controller for inspection annotation operations
 * Handles saving and loading annotations for inspections
 */
@RestController
@RequestMapping("/inspection-annotations")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class InspectionAnnotationController {
    private static final Logger logger = LoggerFactory.getLogger(InspectionAnnotationController.class);

    @Autowired
    private InspectionAnnotationRepository repository;

    /**
     * Save annotations for an inspection
     * POST /api/inspection-annotations/save
     * 
     * This endpoint saves ALL annotations for an inspection.
     * It replaces existing annotations to ensure consistency.
     */
    @PostMapping("/save")
    public ResponseEntity<?> saveAnnotations(@RequestBody SaveAnnotationsRequest request) {
        logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        logger.info("📥 POST request received to save annotations");
        logger.info("📥 Inspection ID (imageId): '{}'", request.getImageId());
        logger.info("📥 User ID: '{}'", request.getUserId());
        logger.info("📥 Number of annotations to save: {}", request.getAnnotations() != null ? request.getAnnotations().size() : 0);
        
        if (request.getImageId() == null || request.getAnnotations() == null) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Inspection ID and annotations are required"));
        }

        try {
            String inspectionId = request.getImageId();
            List<InspectionAnnotation> savedAnnotations = new ArrayList<>();

            // First, delete all existing annotations for this inspection to ensure clean state
            logger.info("🗑️  Deleting existing annotations for inspection_id = '{}'", inspectionId);
            repository.deleteByInspectionId(inspectionId);
            logger.info("✅ Deletion complete");

            // Now save all annotations with deterministic UUIDs
            logger.info("💾 Starting to save {} annotations...", request.getAnnotations().size());
            int boxNumber = 1;
            for (AnnotationDTO dto : request.getAnnotations()) {
                InspectionAnnotation annotation = new InspectionAnnotation();
                
                // Generate deterministic UUID based on inspectionId + boxNumber
                UUID deterministicId = generateDeterministicUUID(inspectionId, boxNumber);
                annotation.setId(deterministicId);
                
                logger.info("  📦 Box #{}: UUID = {}, Label = {}, Position = ({}, {})", 
                    boxNumber, deterministicId, dto.getLabel(), dto.getX(), dto.getY());
                logger.info("       inspection_id will be set to: '{}'", inspectionId);

                // Set all fields
                annotation.setInspectionId(inspectionId);
                annotation.setTransformerId(dto.getTransformerId());
                annotation.setUserId(dto.getUserId() != null ? dto.getUserId() : request.getUserId());
                annotation.setBboxX(dto.getX());
                annotation.setBboxY(dto.getY());
                annotation.setBboxWidth(dto.getWidth());
                annotation.setBboxHeight(dto.getHeight());
                annotation.setLabel(dto.getLabel());
                annotation.setConfidence(dto.getConfidence() != null ? dto.getConfidence() : 1.0);
                annotation.setSeverity(dto.getSeverity());
                annotation.setAction(dto.getAction() != null ? dto.getAction() : "added");
                annotation.setIsAI(dto.getIsAI() != null ? dto.getIsAI() : false);
                annotation.setNotes(dto.getNotes());

                // Set modification tracking
                if (dto.getLastModified() != null) {
                    try {
                        annotation.setLastModified(LocalDateTime.parse(dto.getLastModified()));
                    } catch (Exception e) {
                        annotation.setLastModified(LocalDateTime.now());
                    }
                } else {
                    annotation.setLastModified(LocalDateTime.now());
                }

                if (dto.getModificationTypes() != null && !dto.getModificationTypes().isEmpty()) {
                    annotation.setModificationTypes(String.join(",", dto.getModificationTypes()));
                }
                annotation.setModificationDetails(dto.getModificationDetails());

                // Handle deletion
                if ("deleted".equalsIgnoreCase(dto.getAction())) {
                    annotation.setIsDeleted(true);
                    annotation.setDeletedAt(LocalDateTime.now());
                } else {
                    annotation.setIsDeleted(false);
                }

                savedAnnotations.add(repository.save(annotation));
                boxNumber++;
            }

            logger.info("✅ Successfully saved {} annotations for inspection_id = '{}'", savedAnnotations.size(), inspectionId);
            logger.info("✅ All annotations have inspection_id field set to: '{}'", inspectionId);
            logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

            // Convert to DTOs for response
            List<AnnotationDTO> responseDTOs = savedAnnotations.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                "message", "Annotations saved successfully",
                "count", savedAnnotations.size(),
                "annotations", responseDTOs
            ));

        } catch (Exception e) {
            logger.error("❌ Error saving annotations: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to save annotations", "message", e.getMessage()));
        }
    }

    /**
     * Get all annotations for an inspection
     * GET /api/inspection-annotations/{inspectionId}
     * 
     * Returns ALL annotations (including deleted ones)
     * Frontend will separate them into active and deleted
     */
    @GetMapping("/{inspectionId}")
    public ResponseEntity<?> getAnnotations(@PathVariable String inspectionId) {
        logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        logger.info("📤 GET request received for inspection annotations");
        logger.info("📤 Inspection ID from path variable: '{}'", inspectionId);
        logger.info("📤 Inspection ID length: {}", inspectionId.length());
        logger.info("📤 Calling repository.findByInspectionIdOrderByCreatedAtDesc()");

        try {
            List<InspectionAnnotation> annotations = repository.findByInspectionIdOrderByCreatedAtDesc(inspectionId);
            
            logger.info("✅ Repository query completed");
            logger.info("✅ Found {} annotations for inspection '{}'", annotations.size(), inspectionId);
            
            if (annotations.isEmpty()) {
                logger.warn("⚠️  No annotations found in database for inspection_id = '{}'", inspectionId);
                logger.warn("⚠️  Checking if ANY annotations exist in database...");
                long totalCount = repository.count();
                logger.warn("⚠️  Total annotations in database: {}", totalCount);
                
                if (totalCount > 0) {
                    logger.warn("⚠️  Database has annotations but none match inspection_id = '{}'", inspectionId);
                    // Log first few inspection IDs to help debug
                    List<InspectionAnnotation> allAnnotations = repository.findAll();
                    logger.warn("⚠️  Sample inspection_ids in database:");
                    allAnnotations.stream()
                        .limit(5)
                        .forEach(a -> logger.warn("     - '{}'", a.getInspectionId()));
                }
            } else {
                logger.info("✅ Returning {} annotations", annotations.size());
                annotations.forEach(a -> logger.debug("   - Annotation ID: {}, Label: {}, X: {}, Y: {}", 
                    a.getId(), a.getLabel(), a.getBboxX(), a.getBboxY()));
            }

            List<AnnotationDTO> dtos = annotations.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

            logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            return ResponseEntity.ok(dtos);

        } catch (Exception e) {
            logger.error("❌ Error fetching annotations: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to fetch annotations"));
        }
    }

    /**
     * Delete all annotations for an inspection
     * DELETE /api/inspection-annotations/{inspectionId}
     * 
     * Use this when re-running AI detection to start fresh
     */
    @DeleteMapping("/{inspectionId}")
    public ResponseEntity<?> deleteAllAnnotations(@PathVariable String inspectionId) {
        logger.info("🗑️  Deleting all annotations for inspection: {}", inspectionId);

        try {
            repository.deleteByInspectionId(inspectionId);
            logger.info("✅ Deleted all annotations for inspection {}", inspectionId);

            return ResponseEntity.ok(Map.of("message", "All annotations deleted successfully"));

        } catch (Exception e) {
            logger.error("❌ Error deleting annotations: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to delete annotations"));
        }
    }

    /**
     * Check if annotations exist for an inspection
     * GET /api/inspection-annotations/{inspectionId}/exists
     */
    @GetMapping("/{inspectionId}/exists")
    public ResponseEntity<?> checkAnnotationsExist(@PathVariable String inspectionId) {
        boolean exists = repository.existsByInspectionId(inspectionId);
        long count = repository.countByInspectionId(inspectionId);
        
        return ResponseEntity.ok(Map.of(
            "exists", exists,
            "count", count
        ));
    }

    /**
     * Convert InspectionAnnotation entity to DTO
     */
    private AnnotationDTO convertToDTO(InspectionAnnotation annotation) {
        AnnotationDTO dto = new AnnotationDTO();
        dto.setId(annotation.getId());
        dto.setX(annotation.getBboxX());
        dto.setY(annotation.getBboxY());
        dto.setWidth(annotation.getBboxWidth());
        dto.setHeight(annotation.getBboxHeight());
        dto.setLabel(annotation.getLabel());
        dto.setConfidence(annotation.getConfidence());
        dto.setSeverity(annotation.getSeverity());
        dto.setAction(annotation.getAction());
        dto.setIsAI(annotation.getIsAI());
        dto.setNotes(annotation.getNotes());
        dto.setUserId(annotation.getUserId());
        dto.setImageId(annotation.getInspectionId());
        dto.setTransformerId(annotation.getTransformerId());
        
        if (annotation.getLastModified() != null) {
            dto.setLastModified(annotation.getLastModified().toString());
        }
        
        if (annotation.getModificationTypes() != null && !annotation.getModificationTypes().isEmpty()) {
            dto.setModificationTypes(java.util.Arrays.asList(annotation.getModificationTypes().split(",")));
        }
        
        dto.setModificationDetails(annotation.getModificationDetails());
        
        return dto;
    }

    /**
     * Generate deterministic UUID based on inspectionId and box number
     * This ensures the same box always gets the same UUID
     * Format: UUID v5 (name-based with SHA-1)
     */
    private UUID generateDeterministicUUID(String inspectionId, int boxNumber) {
        try {
            // Create a unique string combining inspection ID and box number
            String uniqueString = inspectionId + "-box-" + boxNumber;
            
            // Generate SHA-1 hash
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            byte[] hash = digest.digest(uniqueString.getBytes(StandardCharsets.UTF_8));
            
            // Convert to UUID format (use first 16 bytes)
            // Set version to 5 (name-based UUID) and variant bits
            hash[6] &= 0x0f;  // Clear version
            hash[6] |= 0x50;  // Set version to 5
            hash[8] &= 0x3f;  // Clear variant
            hash[8] |= 0x80;  // Set variant to IETF
            
            // Create UUID from hash bytes
            long msb = 0;
            long lsb = 0;
            for (int i = 0; i < 8; i++) {
                msb = (msb << 8) | (hash[i] & 0xff);
            }
            for (int i = 8; i < 16; i++) {
                lsb = (lsb << 8) | (hash[i] & 0xff);
            }
            
            UUID uuid = new UUID(msb, lsb);
            logger.debug("Generated deterministic UUID for {}-box-{}: {}", inspectionId, boxNumber, uuid);
            return uuid;
            
        } catch (NoSuchAlgorithmException e) {
            logger.error("Failed to generate deterministic UUID, falling back to random: {}", e.getMessage());
            return UUID.randomUUID();
        }
    }
}
