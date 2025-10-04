package com.transformer.management.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.transformer.management.dto.AnomalyDetectionDTO;
import com.transformer.management.entity.AnomalyDetection;
import com.transformer.management.repository.AnomalyDetectionRepository;
import com.transformer.management.repository.TransformerRepository;
import com.transformer.management.repository.InspectionRepository;
import com.transformer.management.service.engine.AnomalyDetectionEngine;
import com.transformer.management.service.engine.AnomalyDetectionEngineFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Enhanced Anomaly Detection Service with modular engine support and metadata persistence
 * Supports Phase 3 requirements for detection history and feedback
 */
@Service
public class AnomalyDetectionService {
    private static final Logger logger = LoggerFactory.getLogger(AnomalyDetectionService.class);
    
    @Autowired
    private AnomalyDetectionEngineFactory engineFactory;
    
    @Autowired
    private AnomalyDetectionRepository anomalyDetectionRepository;
    
    @Autowired
    private TransformerRepository transformerRepository;
    
    @Autowired
    private InspectionRepository inspectionRepository;
    
    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Detect anomalies in the given image using the best available engine
     * Persists detection results and metadata for Phase 3 retrieval
     * 
     * @param imageUrl The URL of the image to analyze
     * @return The detection results as AnomalyDetectionDTO
     * @throws RuntimeException if the detection fails
     */
    @Transactional
    public AnomalyDetectionDTO detectAnomaly(String imageUrl) {
        return detectAnomaly(imageUrl, null, null, null);
    }
    
    /**
     * Detect anomalies with inspection context and automatic status update
     * 
     * @param imageUrl The URL of the image to analyze
     * @param inspectionId The inspection ID to update status for
     * @return The detection results as AnomalyDetectionDTO
     */
    @Transactional
    public AnomalyDetectionDTO detectAnomalyWithInspection(String imageUrl, UUID inspectionId) {
        logger.info("🔍 Starting anomaly detection with inspection context: {}", inspectionId);
        
        // Update inspection status to "In Progress" before starting detection
        if (inspectionId != null) {
            updateInspectionStatus(inspectionId, "In Progress");
        }
        
        // Perform the detection
        return detectAnomaly(imageUrl, null, null, inspectionId);
    }
    
    /**
     * Update inspection status
     * 
     * @param inspectionId The inspection ID to update
     * @param status The new status value
     */
    private void updateInspectionStatus(UUID inspectionId, String status) {
        try {
            logger.info("📝 Updating inspection {} status to: {}", inspectionId, status);
            
            var inspection = inspectionRepository.findById(inspectionId);
            if (inspection.isPresent()) {
                var insp = inspection.get();
                insp.setStatus(status);
                inspectionRepository.save(insp);
                logger.info("✅ Successfully updated inspection status to: {}", status);
            } else {
                logger.warn("⚠️ Inspection not found: {}", inspectionId);
            }
        } catch (Exception e) {
            logger.error("❌ Failed to update inspection status: {}", e.getMessage(), e);
            // Don't fail the detection if status update fails
        }
    }

    /**
     * Detect anomalies with full context (transformer, inspection, baseline image)
     * 
     * @param maintenanceImageUrl The maintenance image URL to analyze
     * @param baselineImageUrl Optional baseline image URL for comparison
     * @param transformerId Optional transformer ID for linking
     * @param inspectionId Optional inspection ID for linking
     * @return The detection results as AnomalyDetectionDTO
     */
    @Transactional
    public AnomalyDetectionDTO detectAnomaly(String maintenanceImageUrl, String baselineImageUrl, 
                                            UUID transformerId, UUID inspectionId) {
        logger.info("🔍 Starting anomaly detection for maintenance image: {}", maintenanceImageUrl);
        
        long startTime = System.currentTimeMillis();
        
        // Get the best available engine
        AnomalyDetectionEngine engine = engineFactory.getBestAvailableEngine();
        logger.info("Using detection engine: {} v{}", engine.getEngineName(), engine.getEngineVersion());
        
        // Perform detection
        AnomalyDetectionDTO result = engine.detectAnomaly(maintenanceImageUrl);
        
        long processingTime = System.currentTimeMillis() - startTime;
        logger.info("✅ Detection completed in {}ms with {} anomalies", processingTime, result.getDetections().size());
        
        // Persist results to database
        try {
            persistDetectionResults(result, engine, maintenanceImageUrl, baselineImageUrl, 
                                   transformerId, inspectionId, processingTime);
        } catch (Exception e) {
            logger.error("Failed to persist detection results: {}", e.getMessage(), e);
            // Don't fail the detection, just log the error
        }
        
        return result;
    }

    /**
     * Persist detection results and metadata to database for Phase 3 retrieval
     */
    private void persistDetectionResults(AnomalyDetectionDTO result, AnomalyDetectionEngine engine,
                                        String maintenanceImageUrl, String baselineImageUrl,
                                        UUID transformerId, UUID inspectionId, long processingTime) {
        AnomalyDetection record = new AnomalyDetection();
        
        // Set image URLs
        record.setMaintenanceImageUrl(maintenanceImageUrl);
        record.setBaselineImageUrl(baselineImageUrl);
        
        // Set engine metadata
        record.setEngineName(engine.getEngineName());
        record.setEngineVersion(engine.getEngineVersion());
        record.setModelName(engine.getModelName());
        
        // Set detection results
        record.setOverallLabel(result.getLabel());
        record.setOverlayImageUrl(result.getOverlayImage());
        record.setHeatmapImageUrl(result.getHeatmapImage());
        record.setMaskImageUrl(result.getMaskImage());
        
        // Serialize detections to JSON
        try {
            String detectionsJson = objectMapper.writeValueAsString(result.getDetections());
            record.setDetectionsJson(detectionsJson);
        } catch (JsonProcessingException e) {
            logger.warn("Failed to serialize detections to JSON: {}", e.getMessage());
        }
        
        // Calculate summary statistics
        calculateStatistics(record, result.getDetections());
        
        // Set processing metadata
        record.setProcessingTimeMs(processingTime);
        
        // Link to transformer and inspection if provided
        if (transformerId != null) {
            transformerRepository.findById(transformerId).ifPresent(record::setTransformer);
        }
        if (inspectionId != null) {
            inspectionRepository.findById(inspectionId).ifPresent(record::setInspection);
        }
        
        // Save to database
        anomalyDetectionRepository.save(record);
        logger.info("💾 Detection results persisted with ID: {}", record.getId());
    }

    /**
     * Calculate summary statistics from detections
     */
    private void calculateStatistics(AnomalyDetection record, List<AnomalyDetectionDTO.Detection> detections) {
        if (detections == null || detections.isEmpty()) {
            record.setTotalDetections(0);
            record.setCriticalCount(0);
            record.setWarningCount(0);
            record.setUncertainCount(0);
            return;
        }
        
        record.setTotalDetections(detections.size());
        
        // Count severity levels
        int critical = 0;
        int warnings = 0;
        int uncertain = 0;
        
        List<Double> confidences = new ArrayList<>();
        
        for (AnomalyDetectionDTO.Detection detection : detections) {
            double confidence = detection.getConfidence();
            confidences.add(confidence);
            
            // Count uncertain detections (confidence < 60%)
            if (confidence < 0.6) {
                uncertain++;
            }
            
            // Extract severity from type field
            String type = detection.getType().toLowerCase();
            if (type.contains("faulty") || type.contains("critical")) {
                critical++;
            } else if (type.contains("potential") || type.contains("warning")) {
                warnings++;
            }
        }
        
        record.setCriticalCount(critical);
        record.setWarningCount(warnings);
        record.setUncertainCount(uncertain);
        
        // Calculate confidence statistics
        if (!confidences.isEmpty()) {
            record.setMaxConfidence(confidences.stream().max(Double::compare).orElse(0.0));
            record.setMinConfidence(confidences.stream().min(Double::compare).orElse(0.0));
            record.setAvgConfidence(confidences.stream().mapToDouble(Double::doubleValue).average().orElse(0.0));
        }
    }

    /**
     * Check the health status of all registered anomaly detection engines
     * 
     * @return Health status map with engine information
     */
    public Map<String, Object> checkHealth() {
        logger.info("Checking health of all anomaly detection engines");
        
        Map<String, Object> health = new HashMap<>();
        health.put("timestamp", LocalDateTime.now().toString());
        health.put("defaultEngine", engineFactory.getDefaultEngineName());
        
        List<Map<String, Object>> engineStatuses = new ArrayList<>();
        for (AnomalyDetectionEngine engine : engineFactory.getAllEngines()) {
            Map<String, Object> engineStatus = new HashMap<>();
            engineStatus.put("name", engine.getEngineName());
            engineStatus.put("version", engine.getEngineVersion());
            engineStatus.put("model", engine.getModelName());
            engineStatus.put("available", engine.isAvailable());
            engineStatuses.add(engineStatus);
        }
        
        health.put("engines", engineStatuses);
        health.put("totalEngines", engineStatuses.size());
        
        long availableCount = engineStatuses.stream()
            .filter(e -> (Boolean) e.get("available"))
            .count();
        health.put("availableEngines", availableCount);
        
        return health;
    }

    /**
     * Get detection history for a specific transformer
     */
    public List<AnomalyDetection> getDetectionHistory(UUID transformerId) {
        return anomalyDetectionRepository.findByTransformerIdOrderByDetectedAtDesc(transformerId);
    }

    /**
     * Get detection history for a specific inspection
     */
    public List<AnomalyDetection> getDetectionHistoryByInspection(UUID inspectionId) {
        return anomalyDetectionRepository.findByInspectionId(inspectionId);
    }

    /**
     * Get all detections within a date range
     */
    public List<AnomalyDetection> getDetectionsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return anomalyDetectionRepository.findByDetectedAtBetween(startDate, endDate);
    }

    /**
     * Provide feedback for a detection (Phase 3 support)
     */
    @Transactional
    public AnomalyDetection provideFeedback(UUID detectionId, boolean correct, String notes) {
        Optional<AnomalyDetection> detectionOpt = anomalyDetectionRepository.findById(detectionId);
        if (detectionOpt.isEmpty()) {
            throw new RuntimeException("Detection not found: " + detectionId);
        }
        
        AnomalyDetection detection = detectionOpt.get();
        detection.setFeedbackProvided(true);
        detection.setFeedbackCorrect(correct);
        detection.setFeedbackNotes(notes);
        detection.setFeedbackProvidedAt(LocalDateTime.now());
        
        return anomalyDetectionRepository.save(detection);
    }

    /**
     * Get all available engines metadata
     */
    public Map<String, Map<String, Object>> getEnginesMetadata() {
        return engineFactory.getAllEnginesMetadata();
    }
}
