package com.transformer.management.controller;

import com.transformer.management.dto.AnomalyDetectionRequest;
import com.transformer.management.dto.AnomalyDetectionDTO;
import com.transformer.management.service.AnomalyDetectionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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
     * Body: { "imageUrl": "<url>" }
     * 
     * @param request The request containing the image URL
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
            AnomalyDetectionDTO result = anomalyDetectionService.detectAnomaly(request.getImageUrl());
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
}
