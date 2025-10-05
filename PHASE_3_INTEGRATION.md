# Phase 3 Integration Guide

## Overview

This document outlines how the Transformer Management System is prepared for **Phase 3** requirements, specifically:
1. **Detection Output Recording** - All detection results and metadata are persisted
2. **Feedback Collection** - Inspector feedback mechanism for model improvement
3. **Historical Analysis** - Trend detection and performance monitoring

## Phase 3 Requirements Compliance

### ✅ Requirement 1: Record All Detection Outputs

**Implementation**: `AnomalyDetection` entity with comprehensive metadata storage

**What Gets Recorded**:
- ✅ Input images (baseline + maintenance URLs)
- ✅ Detection engine details (name, version, model)
- ✅ All detection results (bounding boxes, types, confidence scores)
- ✅ Summary statistics (total, critical, warnings, uncertain counts)
- ✅ Confidence metrics (min, max, average)
- ✅ Processing performance (time in milliseconds)
- ✅ Timestamps (detection time, creation time)
- ✅ Relationships (transformer, inspection links)

**Database Storage**:
```sql
-- Every detection automatically persisted to this table
SELECT * FROM anomaly_detections WHERE transformer_id = '...';
```

**Example Detection Record**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "transformer": { "id": "...", "code": "AZ-8890" },
  "inspection": { "id": "...", "inspectionNo": "INSP-20251003-0001" },
  "baselineImageUrl": "https://cloudinary.com/...",
  "maintenanceImageUrl": "https://cloudinary.com/...",
  "engineName": "HuggingFace",
  "engineVersion": "1.0.0",
  "modelName": "Senum-Anomaly-Detection",
  "overallLabel": "Critical",
  "overlayImageUrl": "https://huggingface.co/.../boxed_url",
  "detectionsJson": "[{\"bbox\":[684,308,129,117],\"type\":\"Point Overload (Faulty)\",\"confidence\":0.593}]",
  "totalDetections": 6,
  "criticalCount": 2,
  "warningCount": 3,
  "uncertainCount": 4,
  "avgConfidence": 0.567,
  "processingTimeMs": 2345,
  "detectedAt": "2025-10-03T10:30:15",
  "feedbackProvided": false
}
```

### ✅ Requirement 2: Support Feedback for Later Retrieval

**Implementation**: Feedback fields in `AnomalyDetection` entity + REST API endpoints

**Feedback Fields**:
- `feedbackProvided` - Boolean flag indicating if feedback was given
- `feedbackCorrect` - Was the detection accurate? (true/false)
- `feedbackNotes` - Inspector's detailed comments
- `feedbackProvidedAt` - Timestamp of feedback submission

**REST API Endpoint**:
```
POST /api/anomalies/feedback/{detectionId}
Content-Type: application/json

{
  "correct": true,
  "notes": "Correctly identified overheating in bushing. Temperature was 95°C on-site."
}

Response:
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "feedbackProvided": true,
  "feedbackCorrect": true,
  "feedbackNotes": "Correctly identified overheating in bushing. Temperature was 95°C on-site.",
  "feedbackProvidedAt": "2025-10-03T14:22:00"
}
```

**Frontend Integration Example**:
```typescript
// In anomaly-viewer.tsx or inspection detail page
const provideFeedback = async (detectionId: string, correct: boolean, notes: string) => {
  const response = await fetch(`${BACKEND_URL}/anomalies/feedback/${detectionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correct, notes })
  });
  return response.json();
};

// Usage in UI
<Button onClick={() => provideFeedback(detection.id, true, "Accurate detection")}>
  ✅ Confirm Correct
</Button>
<Button onClick={() => provideFeedback(detection.id, false, "False positive")}>
  ❌ Mark Incorrect
</Button>
```

**Query Feedback Data**:
```java
// Get all detections with feedback
List<AnomalyDetection> withFeedback = repository.findDetectionsWithFeedback();

// Get detections needing feedback
List<AnomalyDetection> needFeedback = repository.findDetectionsNeedingFeedback();

// Get correct detections (for training data)
List<AnomalyDetection> correct = repository.findCorrectDetections();

// Get incorrect detections (for model improvement)
List<AnomalyDetection> incorrect = repository.findIncorrectDetections();
```

## Phase 3 Use Cases

### Use Case 1: Model Accuracy Evaluation

**Scenario**: Evaluate how accurate the detection engine is based on inspector feedback

```java
@Service
public class ModelEvaluationService {
    
    @Autowired
    private AnomalyDetectionRepository repository;
    
    public Map<String, Object> evaluateModelAccuracy(String engineName) {
        // Get all detections with feedback for this engine
        List<AnomalyDetection> withFeedback = repository.findDetectionsWithFeedback()
            .stream()
            .filter(d -> d.getEngineName().equals(engineName))
            .toList();
        
        if (withFeedback.isEmpty()) {
            return Map.of("error", "No feedback data available");
        }
        
        long total = withFeedback.size();
        long correct = withFeedback.stream()
            .filter(AnomalyDetection::getFeedbackCorrect)
            .count();
        long incorrect = total - correct;
        
        double accuracy = (double) correct / total * 100;
        
        // Calculate by severity level
        long criticalCorrect = withFeedback.stream()
            .filter(d -> d.getCriticalCount() > 0 && d.getFeedbackCorrect())
            .count();
        long criticalTotal = withFeedback.stream()
            .filter(d -> d.getCriticalCount() > 0)
            .count();
        double criticalAccuracy = criticalTotal > 0 ? 
            (double) criticalCorrect / criticalTotal * 100 : 0;
        
        return Map.of(
            "engineName", engineName,
            "totalEvaluated", total,
            "correct", correct,
            "incorrect", incorrect,
            "accuracy", accuracy,
            "criticalAccuracy", criticalAccuracy
        );
    }
}
```

**REST Endpoint**:
```
GET /api/anomalies/evaluation/{engineName}

Response:
{
  "engineName": "HuggingFace",
  "totalEvaluated": 150,
  "correct": 132,
  "incorrect": 18,
  "accuracy": 88.0,
  "criticalAccuracy": 95.5
}
```

### Use Case 2: Export Training Data

**Scenario**: Export detection results with feedback for training a new model

```java
@Service
public class TrainingDataExportService {
    
    @Autowired
    private AnomalyDetectionRepository repository;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    public String exportTrainingData() throws JsonProcessingException {
        // Get all detections with feedback
        List<AnomalyDetection> data = repository.findDetectionsWithFeedback();
        
        // Transform to training format
        List<Map<String, Object>> trainingSet = new ArrayList<>();
        
        for (AnomalyDetection detection : data) {
            Map<String, Object> sample = new HashMap<>();
            sample.put("image_url", detection.getMaintenanceImageUrl());
            sample.put("baseline_url", detection.getBaselineImageUrl());
            sample.put("detections", objectMapper.readValue(
                detection.getDetectionsJson(), 
                List.class
            ));
            sample.put("ground_truth_correct", detection.getFeedbackCorrect());
            sample.put("inspector_notes", detection.getFeedbackNotes());
            sample.put("transformer_id", detection.getTransformer().getId());
            
            trainingSet.add(sample);
        }
        
        // Export as JSON
        return objectMapper.writerWithDefaultPrettyPrinter()
            .writeValueAsString(trainingSet);
    }
}
```

**Export Format**:
```json
[
  {
    "image_url": "https://cloudinary.com/maintenance_001.jpg",
    "baseline_url": "https://cloudinary.com/baseline_001.jpg",
    "detections": [
      {"bbox": [684, 308, 129, 117], "type": "Point Overload (Faulty)", "confidence": 0.593}
    ],
    "ground_truth_correct": true,
    "inspector_notes": "Correctly identified hot bushing",
    "transformer_id": "550e8400-e29b-41d4-a716-446655440000"
  }
]
```

### Use Case 3: Anomaly Trend Analysis

**Scenario**: Track anomaly trends over time to predict maintenance needs

```java
@Service
public class TrendAnalysisService {
    
    @Autowired
    private AnomalyDetectionRepository repository;
    
    public Map<String, Object> analyzeTransformerTrend(UUID transformerId) {
        // Get detection history (most recent first)
        List<AnomalyDetection> history = 
            repository.findByTransformerIdOrderByDetectedAtDesc(transformerId);
        
        if (history.isEmpty()) {
            return Map.of("message", "No detection history");
        }
        
        // Calculate trend indicators
        List<Map<String, Object>> timeline = new ArrayList<>();
        
        for (AnomalyDetection detection : history) {
            timeline.add(Map.of(
                "date", detection.getDetectedAt().toString(),
                "criticalCount", detection.getCriticalCount(),
                "warningCount", detection.getWarningCount(),
                "avgConfidence", detection.getAvgConfidence(),
                "processingTime", detection.getProcessingTimeMs()
            ));
        }
        
        // Calculate trend direction
        boolean deteriorating = false;
        if (history.size() >= 2) {
            AnomalyDetection latest = history.get(0);
            AnomalyDetection previous = history.get(1);
            deteriorating = latest.getCriticalCount() > previous.getCriticalCount();
        }
        
        // Get latest status
        AnomalyDetection latest = history.get(0);
        
        return Map.of(
            "transformerId", transformerId,
            "totalInspections", history.size(),
            "latestDetection", Map.of(
                "date", latest.getDetectedAt(),
                "criticalCount", latest.getCriticalCount(),
                "warningCount", latest.getWarningCount(),
                "overallLabel", latest.getOverallLabel()
            ),
            "timeline", timeline,
            "trend", deteriorating ? "DETERIORATING" : "STABLE",
            "recommendMaintenance", latest.getCriticalCount() > 0 || deteriorating
        );
    }
}
```

**Response Example**:
```json
{
  "transformerId": "550e8400-e29b-41d4-a716-446655440000",
  "totalInspections": 12,
  "latestDetection": {
    "date": "2025-10-03T10:30:15",
    "criticalCount": 3,
    "warningCount": 2,
    "overallLabel": "Critical"
  },
  "timeline": [
    {"date": "2025-10-03T10:30:15", "criticalCount": 3, "warningCount": 2},
    {"date": "2025-09-15T14:22:00", "criticalCount": 2, "warningCount": 1},
    {"date": "2025-08-20T09:15:30", "criticalCount": 0, "warningCount": 3}
  ],
  "trend": "DETERIORATING",
  "recommendMaintenance": true
}
```

### Use Case 4: Inspector Dashboard

**Scenario**: Dashboard showing detections needing review with uncertainty flags

```java
@RestController
@RequestMapping("/dashboard")
public class InspectorDashboardController {
    
    @Autowired
    private AnomalyDetectionRepository repository;
    
    @GetMapping("/pending-review")
    public ResponseEntity<Map<String, Object>> getPendingReview() {
        // Get detections needing feedback, prioritized by uncertainty
        List<AnomalyDetection> needReview = repository.findDetectionsNeedingFeedback()
            .stream()
            .filter(d -> d.getUncertainCount() > 0 || d.getCriticalCount() > 0)
            .sorted(Comparator.comparing(AnomalyDetection::getAvgConfidence))
            .limit(20)
            .toList();
        
        // Get urgent items (critical + uncertain)
        List<AnomalyDetection> urgent = needReview.stream()
            .filter(d -> d.getCriticalCount() > 0 && d.getUncertainCount() > 0)
            .toList();
        
        return ResponseEntity.ok(Map.of(
            "totalPending", needReview.size(),
            "urgentReview", urgent.size(),
            "items", needReview.stream().map(d -> Map.of(
                "id", d.getId(),
                "transformer", d.getTransformer().getCode(),
                "detectedAt", d.getDetectedAt(),
                "criticalCount", d.getCriticalCount(),
                "uncertainCount", d.getUncertainCount(),
                "avgConfidence", d.getAvgConfidence(),
                "overlayImage", d.getOverlayImageUrl(),
                "priority", d.getCriticalCount() > 0 && d.getUncertainCount() > 0 ? 
                    "URGENT" : "NORMAL"
            )).toList()
        ));
    }
}
```

**Dashboard Response**:
```json
{
  "totalPending": 15,
  "urgentReview": 3,
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "transformer": "AZ-8890",
      "detectedAt": "2025-10-03T10:30:15",
      "criticalCount": 2,
      "uncertainCount": 4,
      "avgConfidence": 0.54,
      "overlayImage": "https://huggingface.co/.../boxed.jpg",
      "priority": "URGENT"
    }
  ]
}
```

### Use Case 5: Comparative Engine Analysis

**Scenario**: Compare performance of different detection engines

```java
@Service
public class EngineComparisonService {
    
    @Autowired
    private AnomalyDetectionRepository repository;
    
    public Map<String, Object> compareEngines() {
        // Get statistics by engine
        List<Object[]> rawStats = repository.getDetectionStatsByEngine();
        
        List<Map<String, Object>> engines = new ArrayList<>();
        
        for (Object[] stat : rawStats) {
            String engineName = (String) stat[0];
            Long count = (Long) stat[1];
            Double avgConfidence = (Double) stat[2];
            Double avgTime = (Double) stat[3];
            
            // Get feedback-based accuracy
            List<AnomalyDetection> withFeedback = repository.findDetectionsWithFeedback()
                .stream()
                .filter(d -> d.getEngineName().equals(engineName))
                .toList();
            
            long correct = withFeedback.stream()
                .filter(AnomalyDetection::getFeedbackCorrect)
                .count();
            
            double accuracy = withFeedback.isEmpty() ? 0.0 : 
                (double) correct / withFeedback.size() * 100;
            
            engines.add(Map.of(
                "name", engineName,
                "totalDetections", count,
                "avgConfidence", avgConfidence * 100, // Convert to percentage
                "avgProcessingTime", avgTime,
                "accuracy", accuracy,
                "feedbackCount", withFeedback.size()
            ));
        }
        
        // Sort by accuracy (highest first)
        engines.sort((a, b) -> Double.compare(
            (Double) b.get("accuracy"), 
            (Double) a.get("accuracy")
        ));
        
        return Map.of(
            "timestamp", LocalDateTime.now(),
            "engines", engines,
            "recommendation", engines.isEmpty() ? "N/A" : 
                ((Map<String, Object>) engines.get(0)).get("name")
        );
    }
}
```

**Comparison Output**:
```json
{
  "timestamp": "2025-10-03T10:30:15",
  "engines": [
    {
      "name": "TensorFlow",
      "totalDetections": 87,
      "avgConfidence": 78.5,
      "avgProcessingTime": 1234,
      "accuracy": 92.3,
      "feedbackCount": 65
    },
    {
      "name": "HuggingFace",
      "totalDetections": 150,
      "avgConfidence": 68.2,
      "avgProcessingTime": 2345,
      "accuracy": 88.0,
      "feedbackCount": 120
    }
  ],
  "recommendation": "TensorFlow"
}
```

## Frontend Integration Examples

### Display Detection with Feedback Option

```typescript
// In inspection detail page
interface DetectionWithFeedback {
  id: string
  detectedAt: string
  criticalCount: number
  warningCount: number
  avgConfidence: number
  overlayImage: string
  feedbackProvided: boolean
  feedbackCorrect?: boolean
  feedbackNotes?: string
}

const DetectionCard = ({ detection }: { detection: DetectionWithFeedback }) => {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [feedbackNotes, setFeedbackNotes] = useState('')
  
  const submitFeedback = async (correct: boolean) => {
    await fetch(`${API_URL}/anomalies/feedback/${detection.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correct, notes: feedbackNotes })
    })
    // Reload detection data
  }
  
  return (
    <Card>
      <img src={detection.overlayImage} alt="Detection" />
      
      <div>
        <Badge variant={detection.criticalCount > 0 ? 'destructive' : 'warning'}>
          {detection.criticalCount} Critical, {detection.warningCount} Warnings
        </Badge>
        <p>Confidence: {(detection.avgConfidence * 100).toFixed(1)}%</p>
      </div>
      
      {!detection.feedbackProvided && (
        <div>
          <Button onClick={() => setShowFeedbackForm(true)}>
            Provide Feedback
          </Button>
          
          {showFeedbackForm && (
            <div>
              <Textarea 
                placeholder="Notes about this detection..." 
                value={feedbackNotes}
                onChange={e => setFeedbackNotes(e.target.value)}
              />
              <Button onClick={() => submitFeedback(true)} variant="success">
                ✅ Correct Detection
              </Button>
              <Button onClick={() => submitFeedback(false)} variant="destructive">
                ❌ Incorrect Detection
              </Button>
            </div>
          )}
        </div>
      )}
      
      {detection.feedbackProvided && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Feedback Provided</AlertTitle>
          <AlertDescription>
            {detection.feedbackCorrect ? 'Marked as correct' : 'Marked as incorrect'}
            <br />
            {detection.feedbackNotes}
          </AlertDescription>
        </Alert>
      )}
    </Card>
  )
}
```

### Inspector Review Queue

```typescript
const InspectorReviewQueue = () => {
  const [pendingReview, setPendingReview] = useState([])
  
  useEffect(() => {
    fetch(`${API_URL}/dashboard/pending-review`)
      .then(res => res.json())
      .then(data => setPendingReview(data.items))
  }, [])
  
  return (
    <div>
      <h2>Detections Pending Review</h2>
      <p>{pendingReview.length} items need your feedback</p>
      
      {pendingReview.map(item => (
        <Card key={item.id} className={item.priority === 'URGENT' ? 'border-red-500' : ''}>
          {item.priority === 'URGENT' && (
            <Badge variant="destructive">🚨 URGENT REVIEW NEEDED</Badge>
          )}
          
          <p>Transformer: {item.transformer}</p>
          <p>Detected: {new Date(item.detectedAt).toLocaleString()}</p>
          <p>{item.criticalCount} Critical, {item.uncertainCount} Uncertain</p>
          <p>Avg Confidence: {(item.avgConfidence * 100).toFixed(1)}%</p>
          
          <img src={item.overlayImage} alt="Detection" />
          
          <Link href={`/inspections/feedback/${item.id}`}>
            <Button>Review Now</Button>
          </Link>
        </Card>
      ))}
    </div>
  )
}
```

## Benefits for Phase 3

### 1. **Complete Audit Trail**
Every detection is permanently recorded with:
- ✅ Who performed it (which engine, which version)
- ✅ When it was performed
- ✅ What was detected (full results + metadata)
- ✅ How long it took
- ✅ Inspector verification status

### 2. **Continuous Improvement**
- ✅ Collect feedback from field inspectors
- ✅ Identify engine weaknesses (false positives/negatives)
- ✅ Export training data for model retraining
- ✅ A/B test new models against production

### 3. **Predictive Maintenance**
- ✅ Track anomaly trends over time
- ✅ Identify transformers deteriorating
- ✅ Prioritize maintenance based on history
- ✅ Estimate remaining useful life

### 4. **Quality Assurance**
- ✅ Flag uncertain detections for manual review
- ✅ Calculate model accuracy metrics
- ✅ Monitor detection engine performance
- ✅ Compare multiple engines

### 5. **Regulatory Compliance**
- ✅ Full traceability of inspections
- ✅ Permanent record of anomaly findings
- ✅ Inspector verification trail
- ✅ Performance metrics for audits

## Database Queries Cheat Sheet

```sql
-- Get all detections for a transformer
SELECT * FROM anomaly_detections 
WHERE transformer_id = '...' 
ORDER BY detected_at DESC;

-- Find critical detections from last month
SELECT * FROM anomaly_detections 
WHERE critical_count > 0 
  AND detected_at >= NOW() - INTERVAL '1 month';

-- Get uncertain detections needing review
SELECT * FROM anomaly_detections 
WHERE uncertain_count > 0 
  AND feedback_provided = FALSE
ORDER BY avg_confidence ASC;

-- Calculate engine accuracy
SELECT 
  engine_name,
  COUNT(*) as total,
  SUM(CASE WHEN feedback_correct = TRUE THEN 1 ELSE 0 END) as correct,
  ROUND(100.0 * SUM(CASE WHEN feedback_correct = TRUE THEN 1 ELSE 0 END) / COUNT(*), 2) as accuracy
FROM anomaly_detections
WHERE feedback_provided = TRUE
GROUP BY engine_name;

-- Find transformers with deteriorating trends
SELECT 
  transformer_id,
  COUNT(*) as inspections,
  AVG(critical_count) as avg_critical,
  MAX(detected_at) as last_inspection
FROM anomaly_detections
GROUP BY transformer_id
HAVING AVG(critical_count) > 1
ORDER BY avg_critical DESC;
```

---

**Document Version**: 1.0  
**Last Updated**: October 3, 2025  
**Status**: ✅ Phase 3 Ready
