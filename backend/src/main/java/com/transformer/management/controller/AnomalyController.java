package com.transformer.management.controller;

import com.transformer.management.dto.AnomalyDetectionRequest;
import com.transformer.management.dto.AnomalyDetectionDTO;
import com.transformer.management.entity.AnomalyDetection;
import com.transformer.management.service.AnomalyDetectionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for anomaly detection operations
 * Supports detection execution, history retrieval, and Phase 3 feedback
 */
@RestController
@RequestMapping("/anomalies")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class AnomalyController {
    private static final Logger logger = LoggerFactory.getLogger(AnomalyController.class);

    @Autowired
    private AnomalyDetectionService anomalyDetectionService;

    /**
     * Detect anomalies in a thermal image
     * POST /api/anomalies/detect
     * Body: { "imageUrl": "<url>", "inspectionId": "<optional-uuid>" }
     * 
     * @param request The request containing the image URL and optional inspection ID
     * @return The anomaly detection results mapped to our DTO format
     */
    @PostMapping("/detect")
    public ResponseEntity<?> detectAnomaly(@RequestBody AnomalyDetectionRequest request) {
        logger.info("Received anomaly detection request for image: {}", request.getImageUrl());
        
        if (request.getImageUrl() == null || request.getImageUrl().trim().isEmpty()) {
            logger.warn("Image URL is missing in the request");
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Image URL is required"));
        }
        
        try {
            // Parse inspection ID if provided
            UUID inspectionId = null;
            if (request.getInspectionId() != null && !request.getInspectionId().trim().isEmpty()) {
                try {
                    inspectionId = UUID.fromString(request.getInspectionId());
                    logger.info("Inspection ID provided: {}", inspectionId);
                } catch (IllegalArgumentException e) {
                    logger.warn("Invalid inspection ID format: {}", request.getInspectionId());
                }
            }
            
            // Perform anomaly detection with inspection context
            AnomalyDetectionDTO result = anomalyDetectionService.detectAnomalyWithInspection(
                request.getImageUrl(), 
                inspectionId
            );
            
            logger.info("Successfully detected anomaly for image: {}", request.getImageUrl());
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            logger.error("Error detecting anomaly: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(Map.of(
                    "error", "Failed to detect anomaly",
                    "message", e.getMessage()
                ));
        }
    }

    /**
     * Check the health status of the anomaly detection API
     * GET /api/anomalies/health
     * 
     * @return Health status of the external API
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        logger.info("Checking health of anomaly detection API");
        
        try {
            Map<String, Object> health = anomalyDetectionService.checkHealth();
            logger.info("Anomaly detection API health check successful");
            return ResponseEntity.ok(health);
            
        } catch (Exception e) {
            logger.error("Error checking health of anomaly detection API: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(Map.of(
                    "error", "Failed to check API health",
                    "message", e.getMessage(),
                    "status", "unhealthy"
                ));
        }
    }

    /**
     * Get detection history for a specific transformer
     * GET /api/anomalies/history/transformer/{transformerId}
     */
    @GetMapping("/history/transformer/{transformerId}")
    public ResponseEntity<?> getTransformerHistory(@PathVariable String transformerId) {
        logger.info("Fetching detection history for transformer: {}", transformerId);
        
        try {
            UUID id = UUID.fromString(transformerId);
            List<AnomalyDetection> history = anomalyDetectionService.getDetectionHistory(id);
            return ResponseEntity.ok(history);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Invalid transformer ID format"));
        } catch (Exception e) {
            logger.error("Error fetching detection history: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to fetch detection history"));
        }
    }

    /**
     * Get detection history for a specific inspection
     * GET /api/anomalies/history/inspection/{inspectionId}
     */
    @GetMapping("/history/inspection/{inspectionId}")
    public ResponseEntity<?> getInspectionHistory(@PathVariable String inspectionId) {
        logger.info("Fetching detection history for inspection: {}", inspectionId);
        
        try {
            UUID id = UUID.fromString(inspectionId);
            List<AnomalyDetection> history = anomalyDetectionService.getDetectionHistoryByInspection(id);
            return ResponseEntity.ok(history);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Invalid inspection ID format"));
        } catch (Exception e) {
            logger.error("Error fetching detection history: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to fetch detection history"));
        }
    }

    /**
     * Get a specific anomaly detection by ID with bounding box data
     * GET /api/anomalies/{detectionId}
     * 
     * @param detectionId The detection ID
     * @return The anomaly detection with bounding boxes
     */
    @GetMapping("/{detectionId}")
    public ResponseEntity<?> getDetectionById(@PathVariable String detectionId) {
        logger.info("Fetching detection by ID: {}", detectionId);
        
        try {
            UUID id = UUID.fromString(detectionId);
            AnomalyDetection detection = anomalyDetectionService.getDetectionById(id);
            
            if (detection == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Convert to DTO format for frontend
            Map<String, Object> response = new HashMap<>();
            response.put("id", detection.getId());
            response.put("originalImage", detection.getMaintenanceImageUrl());
            response.put("overlayImage", detection.getOverlayImageUrl());
            response.put("heatmapImage", detection.getHeatmapImageUrl());
            response.put("maskImage", detection.getMaskImageUrl());
            response.put("label", detection.getOverallLabel());
            response.put("engineName", detection.getEngineName());
            response.put("engineVersion", detection.getEngineVersion());
            response.put("detectedAt", detection.getDetectedAt());
            
            // Parse detections JSON
            if (detection.getDetectionsJson() != null) {
                try {
                    List<?> detections = new com.fasterxml.jackson.databind.ObjectMapper()
                        .readValue(detection.getDetectionsJson(), List.class);
                    response.put("detections", detections);
                } catch (Exception e) {
                    logger.warn("Failed to parse detections JSON: {}", e.getMessage());
                    response.put("detections", new ArrayList<>());
                }
            } else {
                response.put("detections", new ArrayList<>());
            }
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Invalid detection ID format"));
        } catch (Exception e) {
            logger.error("Error fetching detection: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to fetch detection"));
        }
    }

    /**
     * Get detections within a date range
     * GET /api/anomalies/history?startDate=2025-01-01T00:00:00&endDate=2025-12-31T23:59:59
     */
    @GetMapping("/history")
    public ResponseEntity<?> getDetectionsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        logger.info("Fetching detections between {} and {}", startDate, endDate);
        
        try {
            List<AnomalyDetection> detections = anomalyDetectionService.getDetectionsByDateRange(startDate, endDate);
            return ResponseEntity.ok(detections);
        } catch (Exception e) {
            logger.error("Error fetching detections by date range: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to fetch detections"));
        }
    }

    /**
     * Provide feedback for a detection (Phase 3 support)
     * POST /api/anomalies/feedback/{detectionId}
     * Body: { "correct": true, "notes": "Feedback notes" }
     */
    @PostMapping("/feedback/{detectionId}")
    public ResponseEntity<?> provideFeedback(
            @PathVariable String detectionId,
            @RequestBody Map<String, Object> feedback) {
        logger.info("Providing feedback for detection: {}", detectionId);
        
        try {
            UUID id = UUID.fromString(detectionId);
            Boolean correct = (Boolean) feedback.get("correct");
            String notes = (String) feedback.get("notes");
            
            if (correct == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Feedback 'correct' field is required"));
            }
            
            AnomalyDetection updated = anomalyDetectionService.provideFeedback(id, correct, notes);
            return ResponseEntity.ok(updated);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Invalid detection ID format"));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error providing feedback: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to provide feedback"));
        }
    }

    /**
     * Get all available detection engines metadata
     * GET /api/anomalies/engines
     */
    @GetMapping("/engines")
    public ResponseEntity<Map<String, Map<String, Object>>> getEngines() {
        logger.info("Fetching available detection engines");
        
        try {
            Map<String, Map<String, Object>> engines = anomalyDetectionService.getEnginesMetadata();
            return ResponseEntity.ok(engines);
        } catch (Exception e) {
            logger.error("Error fetching engines metadata: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Update anomaly detection counts after manual annotation edits
     * PUT /api/anomalies/update-counts/{inspectionId}
     * Body: { "totalDetections": 5, "criticalCount": 2, "warningCount": 3 }
     */
    @PutMapping("/update-counts/{inspectionId}")
    public ResponseEntity<?> updateAnomalyCounts(
            @PathVariable String inspectionId,
            @RequestBody Map<String, Integer> counts) {
        logger.info("Updating anomaly counts for inspection: {}", inspectionId);
        
        try {
            UUID id = UUID.fromString(inspectionId);
            
            Integer totalDetections = counts.get("totalDetections");
            Integer criticalCount = counts.get("criticalCount");
            Integer warningCount = counts.get("warningCount");
            
            if (totalDetections == null || criticalCount == null || warningCount == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "totalDetections, criticalCount, and warningCount are required"));
            }
            
            AnomalyDetection updated = anomalyDetectionService.updateAnomalyCounts(
                id, totalDetections, criticalCount, warningCount
            );
            
            if (updated == null) {
                return ResponseEntity.status(404)
                    .body(Map.of("error", "No anomaly detection found for inspection " + inspectionId));
            }
            
            logger.info("Successfully updated anomaly counts for inspection: {}", inspectionId);
            return ResponseEntity.ok(Map.of(
                "message", "Anomaly counts updated successfully",
                "totalDetections", updated.getTotalDetections(),
                "criticalCount", updated.getCriticalCount(),
                "warningCount", updated.getWarningCount()
            ));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400)
                .body(Map.of("error", "Invalid inspection ID format"));
        } catch (Exception e) {
            logger.error("Error updating anomaly counts: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(Map.of("error", "Failed to update anomaly counts"));
        }
    }
}
