# Modular Anomaly Detection Architecture

## Overview

The Transformer Management System now implements a **modular, extensible anomaly detection architecture** that supports multiple detection engines and comprehensive metadata persistence for Phase 3 requirements.

## Architecture Components

### 1. **AnomalyDetectionEngine Interface**
The core abstraction that defines the contract for all detection engines.

**Location**: `backend/src/main/java/com/transformer/management/service/engine/AnomalyDetectionEngine.java`

**Key Methods**:
- `String getEngineName()` - Returns engine identifier (e.g., "HuggingFace", "TensorFlow")
- `String getEngineVersion()` - Returns version for tracking evolution
- `String getModelName()` - Returns model identifier for traceability
- `boolean isAvailable()` - Health check for engine availability
- `AnomalyDetectionDTO detectAnomaly(String imageUrl)` - Core detection method
- `Map<String, Object> getEngineMetadata()` - Engine capabilities and requirements

**Benefits**:
- **Pluggable Architecture**: Add new detection engines without modifying existing code
- **Version Tracking**: Track which engine/model version produced each detection
- **Graceful Degradation**: System can fall back to alternative engines if primary is unavailable
- **A/B Testing**: Run multiple engines in parallel to compare performance

### 2. **HuggingFaceAnomalyEngine**
Current production implementation using the Senum Hugging Face API.

**Location**: `backend/src/main/java/com/transformer/management/service/engine/HuggingFaceAnomalyEngine.java`

**Configuration**:
- Engine Name: `HuggingFace`
- Engine Version: `1.0.0`
- Model Name: `Senum-Anomaly-Detection`
- API URL: `https://Senum-anomaly-detection-api.hf.space`

**Features**:
- REST API integration with external Hugging Face model
- Robust error handling and retry logic
- Comprehensive response mapping
- Performance timing for monitoring

### 3. **AnomalyDetectionEngineFactory**
Factory pattern implementation for engine management and selection.

**Location**: `backend/src/main/java/com/transformer/management/service/engine/AnomalyDetectionEngineFactory.java`

**Features**:
- **Engine Registry**: Maintains collection of available engines
- **Default Engine**: Configurable default engine selection
- **Best Available Engine**: Intelligent selection based on health status
- **Metadata Access**: Query capabilities and status of all engines

**Usage Example**:
```java
// Get default engine
AnomalyDetectionEngine engine = factory.getDefaultEngine();

// Get specific engine by name
AnomalyDetectionEngine tfEngine = factory.getEngine("TensorFlow");

// Get best available engine (prefers healthy engines)
AnomalyDetectionEngine bestEngine = factory.getBestAvailableEngine();

// Get all engines metadata
Map<String, Map<String, Object>> metadata = factory.getAllEnginesMetadata();
```

### 4. **AnomalyDetection Entity**
Database entity for persistent storage of detection results and metadata.

**Location**: `backend/src/main/java/com/transformer/management/entity/AnomalyDetection.java`

**Key Fields**:

**Image Context**:
- `baselineImageUrl` - URL of baseline thermal image
- `maintenanceImageUrl` - URL of maintenance thermal image

**Engine Metadata** (for modular support):
- `engineName` - Which engine performed detection (e.g., "HuggingFace")
- `engineVersion` - Engine version (e.g., "1.0.0")
- `modelName` - Model identifier (e.g., "Senum-Anomaly-Detection")

**Detection Results**:
- `overallLabel` - Overall classification (e.g., "Critical", "Warning", "Normal")
- `overlayImageUrl` - Annotated image with bounding boxes
- `heatmapImageUrl` - Heatmap visualization
- `maskImageUrl` - Segmentation mask
- `detectionsJson` - JSON array of all detections with bbox, confidence, type

**Summary Statistics**:
- `totalDetections` - Total number of anomalies detected
- `criticalCount` - Number of critical anomalies (type contains "Faulty")
- `warningCount` - Number of warnings (type contains "Potential")
- `uncertainCount` - Number of uncertain detections (confidence < 60%)
- `maxConfidence` - Highest confidence score
- `minConfidence` - Lowest confidence score
- `avgConfidence` - Average confidence across all detections

**Performance Metadata**:
- `processingTimeMs` - Time taken for detection in milliseconds
- `apiResponseRaw` - Raw API response for debugging

**Phase 3 Feedback Support**:
- `feedbackProvided` - Boolean flag for feedback status
- `feedbackCorrect` - Was the detection accurate?
- `feedbackNotes` - Inspector notes about the detection
- `feedbackProvidedAt` - Timestamp of feedback

**Database Indexes**:
- `idx_inspection_id` - Fast lookup by inspection
- `idx_transformer_id` - Fast lookup by transformer
- `idx_detected_at` - Chronological queries
- `idx_engine_name` - Engine comparison queries

### 5. **AnomalyDetectionRepository**
JPA repository with comprehensive query methods for detection history.

**Location**: `backend/src/main/java/com/transformer/management/repository/AnomalyDetectionRepository.java`

**Key Query Methods**:

**Basic Retrieval**:
- `findByInspectionId(UUID)` - Get all detections for an inspection
- `findByTransformerId(UUID)` - Get all detections for a transformer
- `findByEngineName(String)` - Get detections by specific engine
- `findByEngineNameAndEngineVersion(String, String)` - Version-specific queries

**Time-Based Queries**:
- `findByDetectedAtBetween(LocalDateTime, LocalDateTime)` - Date range queries
- `findByTransformerAndDateRange(UUID, LocalDateTime, LocalDateTime)` - Transformer timeline

**Severity Filtering**:
- `findCriticalDetections()` - All detections with critical anomalies
- `findUncertainDetections()` - All detections needing review (uncertainCount > 0)

**Confidence-Based Queries**:
- `findHighConfidenceDetections(Double)` - Detections above confidence threshold
- `findLowConfidenceDetections(Double)` - Detections below threshold (need review)

**Phase 3 Feedback Queries**:
- `findDetectionsWithFeedback()` - All reviewed detections
- `findDetectionsNeedingFeedback()` - Detections awaiting inspector feedback
- `findCorrectDetections()` - Validated detections for model training
- `findIncorrectDetections()` - Errors for model improvement

**Analytics**:
- `getDetectionStatsByEngine()` - Compare engine performance (count, avg confidence, avg time)
- `countByTransformer(UUID)` - Total detections per transformer
- `countCriticalByTransformer(UUID)` - Critical detection count

### 6. **Enhanced AnomalyDetectionService**
Refactored service using modular architecture with persistence.

**Location**: `backend/src/main/java/com/transformer/management/service/AnomalyDetectionService.java`

**Key Methods**:

**Detection**:
```java
// Simple detection
AnomalyDetectionDTO detectAnomaly(String imageUrl)

// Full context detection with persistence
AnomalyDetectionDTO detectAnomaly(String maintenanceImageUrl, 
                                  String baselineImageUrl,
                                  UUID transformerId, 
                                  UUID inspectionId)
```

**History Retrieval**:
```java
List<AnomalyDetection> getDetectionHistory(UUID transformerId)
List<AnomalyDetection> getDetectionHistoryByInspection(UUID inspectionId)
List<AnomalyDetection> getDetectionsByDateRange(LocalDateTime start, LocalDateTime end)
```

**Phase 3 Feedback**:
```java
AnomalyDetection provideFeedback(UUID detectionId, boolean correct, String notes)
```

**Engine Management**:
```java
Map<String, Object> checkHealth() // All engines health status
Map<String, Map<String, Object>> getEnginesMetadata() // Engine capabilities
```

**Automatic Metadata Persistence**:
The service automatically:
1. Uses the best available engine
2. Performs detection
3. Calculates summary statistics (critical/warning/uncertain counts)
4. Extracts severity from type field ("Faulty" → Critical, "Potential" → Warning)
5. Serializes full detection results to JSON
6. Links to transformer and inspection
7. Records engine version for traceability
8. Stores processing time for performance monitoring
9. Persists everything to database

### 7. **REST API Endpoints**
Comprehensive API for detection and history management.

**Location**: `backend/src/main/java/com/transformer/management/controller/AnomalyController.java`

**Endpoints**:

**Detection**:
```
POST /api/anomalies/detect
Body: { "imageUrl": "https://..." }
Response: AnomalyDetectionDTO with detections
```

**Health Check**:
```
GET /api/anomalies/health
Response: {
  "timestamp": "2025-10-03T10:30:00",
  "defaultEngine": "HuggingFace",
  "engines": [{
    "name": "HuggingFace",
    "version": "1.0.0",
    "model": "Senum-Anomaly-Detection",
    "available": true
  }],
  "totalEngines": 1,
  "availableEngines": 1
}
```

**History Retrieval**:
```
GET /api/anomalies/history/transformer/{transformerId}
GET /api/anomalies/history/inspection/{inspectionId}
GET /api/anomalies/history?startDate=2025-01-01T00:00:00&endDate=2025-12-31T23:59:59
```

**Feedback (Phase 3)**:
```
POST /api/anomalies/feedback/{detectionId}
Body: {
  "correct": true,
  "notes": "Correctly identified overheating in bushing"
}
```

**Engine Metadata**:
```
GET /api/anomalies/engines
Response: {
  "HuggingFace": {
    "name": "HuggingFace",
    "version": "1.0.0",
    "model": "Senum-Anomaly-Detection",
    "apiUrl": "https://Senum-anomaly-detection-api.hf.space",
    "available": true,
    "supportedFormats": ["JPEG", "PNG"],
    "maxImageSize": "10MB",
    "avgResponseTime": "2-5 seconds"
  }
}
```

## Adding New Detection Engines

### Step 1: Implement AnomalyDetectionEngine Interface

```java
@Component("tensorFlowEngine")
public class TensorFlowAnomalyEngine implements AnomalyDetectionEngine {
    private static final String ENGINE_NAME = "TensorFlow";
    private static final String ENGINE_VERSION = "2.0.0";
    private static final String MODEL_NAME = "Custom-Thermal-CNN";
    
    @Override
    public String getEngineName() { return ENGINE_NAME; }
    
    @Override
    public String getEngineVersion() { return ENGINE_VERSION; }
    
    @Override
    public String getModelName() { return MODEL_NAME; }
    
    @Override
    public boolean isAvailable() {
        // Check if TensorFlow model is loaded and ready
        return modelLoaded && gpuAvailable;
    }
    
    @Override
    public AnomalyDetectionDTO detectAnomaly(String imageUrl) {
        // Your TensorFlow detection logic here
        // 1. Download/load image
        // 2. Preprocess for TensorFlow model
        // 3. Run inference
        // 4. Post-process results
        // 5. Map to AnomalyDetectionDTO format
        return dto;
    }
    
    @Override
    public Map<String, Object> getEngineMetadata() {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("name", ENGINE_NAME);
        metadata.put("version", ENGINE_VERSION);
        metadata.put("model", MODEL_NAME);
        metadata.put("framework", "TensorFlow 2.x");
        metadata.put("gpuAccelerated", true);
        return metadata;
    }
}
```

### Step 2: Register in Factory

```java
@Component
public class AnomalyDetectionEngineFactory {
    @Autowired
    public AnomalyDetectionEngineFactory(
        @Qualifier("huggingFaceEngine") AnomalyDetectionEngine huggingFaceEngine,
        @Qualifier("tensorFlowEngine") AnomalyDetectionEngine tensorFlowEngine
    ) {
        registerEngine(huggingFaceEngine);
        registerEngine(tensorFlowEngine);
    }
}
```

### Step 3: Use New Engine

```java
// Explicitly use TensorFlow engine
AnomalyDetectionEngine tfEngine = factory.getEngine("TensorFlow");
AnomalyDetectionDTO result = tfEngine.detectAnomaly(imageUrl);

// Or let factory choose best available
AnomalyDetectionEngine bestEngine = factory.getBestAvailableEngine();
```

## Phase 3 Integration

### Detection History Analysis

```java
// Get all detections for transformer over time
List<AnomalyDetection> history = repository.findByTransformerIdOrderByDetectedAtDesc(transformerId);

// Analyze trend: are anomalies getting worse?
for (AnomalyDetection detection : history) {
    System.out.println(detection.getDetectedAt() + ": " + 
                      detection.getCriticalCount() + " critical, " +
                      detection.getWarningCount() + " warnings");
}
```

### Feedback Loop for Model Improvement

```java
// Get detections needing feedback
List<AnomalyDetection> needReview = repository.findDetectionsNeedingFeedback();

// Inspector provides feedback
service.provideFeedback(detection.getId(), true, "Correctly identified hot bushing");

// Export feedback for model training
List<AnomalyDetection> correct = repository.findCorrectDetections();
List<AnomalyDetection> incorrect = repository.findIncorrectDetections();

// Calculate accuracy by engine
for (String engineName : List.of("HuggingFace", "TensorFlow")) {
    long totalByEngine = repository.findByEngineName(engineName).size();
    long correctByEngine = repository.findCorrectDetections().stream()
        .filter(d -> d.getEngineName().equals(engineName))
        .count();
    double accuracy = (double) correctByEngine / totalByEngine * 100;
    System.out.println(engineName + " accuracy: " + accuracy + "%");
}
```

### Uncertainty Detection

```java
// Get detections with low confidence (< 60%)
List<AnomalyDetection> uncertain = repository.findUncertainDetections();

// Prioritize for manual inspection
uncertain.sort(Comparator.comparing(AnomalyDetection::getAvgConfidence));

System.out.println("Top 10 detections needing manual review:");
uncertain.stream()
    .limit(10)
    .forEach(d -> System.out.println(
        "Detection " + d.getId() + 
        " for transformer " + d.getTransformer().getCode() +
        " has avg confidence " + d.getAvgConfidence() * 100 + "%"
    ));
```

## Performance Monitoring

### Track Engine Performance

```java
// Compare engine performance
List<Object[]> stats = repository.getDetectionStatsByEngine();

for (Object[] stat : stats) {
    String engineName = (String) stat[0];
    Long count = (Long) stat[1];
    Double avgConfidence = (Double) stat[2];
    Double avgTime = (Double) stat[3];
    
    System.out.println(String.format(
        "%s: %d detections, %.2f%% avg confidence, %.0fms avg time",
        engineName, count, avgConfidence * 100, avgTime
    ));
}
```

### Monitor Detection Trends

```java
// Get detections by date range for trend analysis
LocalDateTime lastMonth = LocalDateTime.now().minusMonths(1);
LocalDateTime now = LocalDateTime.now();

List<AnomalyDetection> recentDetections = 
    repository.findByDetectedAtBetween(lastMonth, now);

// Group by week
Map<Integer, List<AnomalyDetection>> byWeek = recentDetections.stream()
    .collect(Collectors.groupingBy(d -> d.getDetectedAt().get(ChronoField.ALIGNED_WEEK_OF_YEAR)));

// Analyze trend
byWeek.forEach((week, detections) -> {
    long criticalCount = detections.stream()
        .mapToLong(AnomalyDetection::getCriticalCount)
        .sum();
    System.out.println("Week " + week + ": " + criticalCount + " critical anomalies");
});
```

## Database Schema

The `anomaly_detections` table is automatically created by JPA with the following structure:

```sql
CREATE TABLE anomaly_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID REFERENCES inspections(id),
    transformer_id UUID REFERENCES transformers(id),
    baseline_image_url TEXT,
    maintenance_image_url TEXT,
    engine_name VARCHAR(255) NOT NULL,
    engine_version VARCHAR(50),
    model_name VARCHAR(255),
    overall_label VARCHAR(50),
    overlay_image_url TEXT,
    heatmap_image_url TEXT,
    mask_image_url TEXT,
    detections_json TEXT,
    total_detections INTEGER DEFAULT 0,
    critical_count INTEGER DEFAULT 0,
    warning_count INTEGER DEFAULT 0,
    uncertain_count INTEGER DEFAULT 0,
    max_confidence DOUBLE PRECISION,
    min_confidence DOUBLE PRECISION,
    avg_confidence DOUBLE PRECISION,
    processing_time_ms BIGINT,
    api_response_raw TEXT,
    detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    feedback_provided BOOLEAN DEFAULT FALSE,
    feedback_correct BOOLEAN,
    feedback_notes TEXT,
    feedback_provided_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_inspection_id ON anomaly_detections(inspection_id);
CREATE INDEX idx_transformer_id ON anomaly_detections(transformer_id);
CREATE INDEX idx_detected_at ON anomaly_detections(detected_at);
CREATE INDEX idx_engine_name ON anomaly_detections(engine_name);
```

## Configuration

### Set Default Engine

```java
@Autowired
private AnomalyDetectionEngineFactory factory;

// Set default engine via configuration
factory.setDefaultEngine("TensorFlow");
```

### Engine Selection Strategy

The factory provides intelligent engine selection:

1. **Default Engine** - Use configured default engine
2. **Best Available** - Prefer engines that pass health check
3. **Explicit Selection** - Manually choose engine by name

## Logging

All operations are logged with emoji indicators for easy monitoring:

- 🔍 Starting detection
- ✅ Detection successful
- 💾 Results persisted
- ⚠️ Warning conditions
- ❌ Errors

**Example Log Output**:
```
2025-10-03 10:30:15 INFO  🔍 Starting anomaly detection for maintenance image: https://...
2025-10-03 10:30:16 INFO  Using detection engine: HuggingFace v1.0.0
2025-10-03 10:30:18 INFO  ✅ Detection completed in 2345ms with 6 anomalies
2025-10-03 10:30:18 INFO  💾 Detection results persisted with ID: 550e8400-e29b-41d4-a716-446655440000
```

## Benefits Summary

### Modularity
- ✅ Easy to add new detection engines
- ✅ A/B testing different models
- ✅ Gradual migration between engines
- ✅ Mix-and-match engines for different scenarios

### Persistence
- ✅ Complete detection history for analysis
- ✅ Track engine performance over time
- ✅ Support Phase 3 feedback loops
- ✅ Audit trail for regulatory compliance

### Evolution
- ✅ Version tracking for all detections
- ✅ Compare old vs new model performance
- ✅ Roll back to previous engine if needed
- ✅ Continuous improvement through feedback

### Scalability
- ✅ Database-backed history (no memory limits)
- ✅ Efficient queries with proper indexing
- ✅ Support for distributed engines
- ✅ Ready for big data analytics

## Next Steps

1. **Train Custom Models** - Use detection history and feedback to train domain-specific models
2. **Implement Ensemble Methods** - Combine multiple engines for better accuracy
3. **Add Real-time Monitoring** - Dashboard for engine health and detection trends
4. **Export Capabilities** - Generate reports from detection history
5. **Mobile Integration** - Field inspector feedback collection via mobile app

---

**Documentation Version**: 1.0  
**Last Updated**: October 3, 2025  
**Authors**: Transformer Management System Team
