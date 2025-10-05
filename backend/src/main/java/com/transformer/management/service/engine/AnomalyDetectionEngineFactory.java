package com.transformer.management.service.engine;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Factory for creating and managing anomaly detection engines
 * Supports modular integration and engine evolution over time
 */
@Component
public class AnomalyDetectionEngineFactory {
    private static final Logger logger = LoggerFactory.getLogger(AnomalyDetectionEngineFactory.class);
    
    private final Map<String, AnomalyDetectionEngine> engines = new HashMap<>();
    private String defaultEngineName = "HuggingFace";

    @Autowired
    public AnomalyDetectionEngineFactory(
        @Qualifier("huggingFaceEngine") AnomalyDetectionEngine huggingFaceEngine
        // Future engines can be autowired here:
        // @Qualifier("tensorFlowEngine") AnomalyDetectionEngine tensorFlowEngine,
        // @Qualifier("customEngine") AnomalyDetectionEngine customEngine
    ) {
        // Register available engines
        registerEngine(huggingFaceEngine);
        
        logger.info("AnomalyDetectionEngineFactory initialized with {} engine(s)", engines.size());
    }

    /**
     * Register a new detection engine
     */
    public void registerEngine(AnomalyDetectionEngine engine) {
        engines.put(engine.getEngineName(), engine);
        logger.info("Registered anomaly detection engine: {} v{}", 
                   engine.getEngineName(), engine.getEngineVersion());
    }

    /**
     * Get the default detection engine
     */
    public AnomalyDetectionEngine getDefaultEngine() {
        return getEngine(defaultEngineName);
    }

    /**
     * Get a specific detection engine by name
     */
    public AnomalyDetectionEngine getEngine(String engineName) {
        AnomalyDetectionEngine engine = engines.get(engineName);
        if (engine == null) {
            logger.warn("Requested engine '{}' not found, falling back to default", engineName);
            engine = engines.get(defaultEngineName);
        }
        if (engine == null) {
            throw new RuntimeException("No anomaly detection engines available");
        }
        return engine;
    }

    /**
     * Get the best available engine (prefers engines that are currently available)
     */
    public AnomalyDetectionEngine getBestAvailableEngine() {
        // First try default engine
        AnomalyDetectionEngine defaultEngine = engines.get(defaultEngineName);
        if (defaultEngine != null && defaultEngine.isAvailable()) {
            return defaultEngine;
        }

        // Find any available engine
        for (AnomalyDetectionEngine engine : engines.values()) {
            if (engine.isAvailable()) {
                logger.info("Using available engine: {}", engine.getEngineName());
                return engine;
            }
        }

        // No engines available, return default anyway and let it fail gracefully
        logger.warn("No engines are currently available, returning default engine");
        return defaultEngine != null ? defaultEngine : engines.values().iterator().next();
    }

    /**
     * Get all registered engines
     */
    public List<AnomalyDetectionEngine> getAllEngines() {
        return new ArrayList<>(engines.values());
    }

    /**
     * Get metadata for all registered engines
     */
    public Map<String, Map<String, Object>> getAllEnginesMetadata() {
        Map<String, Map<String, Object>> metadata = new HashMap<>();
        for (AnomalyDetectionEngine engine : engines.values()) {
            metadata.put(engine.getEngineName(), engine.getEngineMetadata());
        }
        return metadata;
    }

    /**
     * Set the default engine
     */
    public void setDefaultEngine(String engineName) {
        if (engines.containsKey(engineName)) {
            this.defaultEngineName = engineName;
            logger.info("Default engine changed to: {}", engineName);
        } else {
            logger.warn("Cannot set default engine to '{}' - engine not found", engineName);
        }
    }

    /**
     * Get the name of the default engine
     */
    public String getDefaultEngineName() {
        return defaultEngineName;
    }
}
