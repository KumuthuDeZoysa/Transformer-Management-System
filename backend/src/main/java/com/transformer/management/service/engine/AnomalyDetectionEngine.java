package com.transformer.management.service.engine;

import com.transformer.management.dto.AnomalyDetectionDTO;

/**
 * Interface for modular anomaly detection engines
 * Allows the system to evolve with different detection algorithms over time
 * 
 * Implementations can include:
 * - HuggingFace API (current)
 * - TensorFlow models
 * - PyTorch models
 * - Custom trained models
 * - Ensemble methods combining multiple engines
 */
public interface AnomalyDetectionEngine {
    
    /**
     * Get the name of this detection engine
     * @return Engine name (e.g., "HuggingFace", "TensorFlow", "Custom-v2")
     */
    String getEngineName();
    
    /**
     * Get the version of this detection engine
     * @return Engine version (e.g., "1.0", "2.3.1")
     */
    String getEngineVersion();
    
    /**
     * Get the model name used by this engine
     * @return Model name (e.g., "thermal-anomaly-detector-v3")
     */
    String getModelName();
    
    /**
     * Check if this engine is available and healthy
     * @return true if engine can process requests, false otherwise
     */
    boolean isAvailable();
    
    /**
     * Detect anomalies in the given thermal image
     * 
     * @param imageUrl The URL of the thermal image to analyze
     * @return Detection results with bounding boxes, confidence scores, and metadata
     * @throws RuntimeException if detection fails
     */
    AnomalyDetectionDTO detectAnomaly(String imageUrl);
    
    /**
     * Get metadata about this engine's capabilities and requirements
     * @return Engine metadata as a map
     */
    java.util.Map<String, Object> getEngineMetadata();
}
