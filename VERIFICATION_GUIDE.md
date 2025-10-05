# Backend Implementation Verification Script

## How to Verify the New Implementation

This script will help you verify that all the new anomaly detection features are working correctly.

### ✅ Step 1: Verify Database Table Creation

**When to check**: After starting the backend server

**What to check**: The `anomaly_detections` table should be automatically created

**How to verify**:
1. Start your backend server:
   ```powershell
   cd backend
   mvn spring-boot:run
   ```

2. Look for this in the logs:
   ```
   Hibernate: create table anomaly_detections (...)
   ```

3. Or connect to your PostgreSQL database and run:
   ```sql
   -- Check if table exists
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name = 'anomaly_detections';
   
   -- View table structure
   \d anomaly_detections
   ```

**Expected result**: Table exists with columns like `id`, `engine_name`, `detections_json`, `feedback_provided`, etc.

---

### ✅ Step 2: Verify New REST Endpoints

**When to check**: After backend server is running

**How to verify**:

#### A. Check Health Endpoint
```powershell
# PowerShell
Invoke-RestMethod -Uri "http://localhost:8080/api/anomalies/health" -Method Get | ConvertTo-Json -Depth 10
```

**Expected response**:
```json
{
  "timestamp": "2025-10-03T10:30:15",
  "defaultEngine": "HuggingFace",
  "engines": [
    {
      "name": "HuggingFace",
      "version": "1.0.0",
      "model": "Senum-Anomaly-Detection",
      "available": true
    }
  ],
  "totalEngines": 1,
  "availableEngines": 1
}
```

#### B. Check Engines Metadata
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/anomalies/engines" -Method Get | ConvertTo-Json -Depth 10
```

**Expected response**:
```json
{
  "HuggingFace": {
    "name": "HuggingFace",
    "version": "1.0.0",
    "model": "Senum-Anomaly-Detection",
    "apiUrl": "https://Senum-anomaly-detection-api.hf.space",
    "available": true,
    "supportedFormats": ["JPEG", "PNG"],
    "maxImageSize": "10MB"
  }
}
```

---

### ✅ Step 3: Verify Detection Persistence

**When to check**: After running anomaly detection

**How to verify**:

1. **Run a detection from the UI**:
   - Go to an inspection detail page
   - Upload baseline and maintenance images
   - Click "Analyze Images"

2. **Check backend logs** for persistence confirmation:
   ```
   🔍 Starting anomaly detection for maintenance image: https://...
   Using detection engine: HuggingFace v1.0.0
   ✅ Detection completed in 2345ms with 6 anomalies
   💾 Detection results persisted with ID: 550e8400-e29b-41d4-a716-446655440000
   ```

3. **Query the database** to see the record:
   ```sql
   SELECT 
     id,
     engine_name,
     engine_version,
     detected_at,
     total_detections,
     critical_count,
     warning_count,
     uncertain_count,
     avg_confidence,
     processing_time_ms
   FROM anomaly_detections
   ORDER BY detected_at DESC
   LIMIT 1;
   ```

**Expected result**: A record should exist with all metadata populated

---

### ✅ Step 4: Verify History Retrieval

**When to check**: After at least one detection has been run

**How to verify**:

#### A. Get History by Transformer
```powershell
# Replace {transformerId} with actual UUID from your database
$transformerId = "YOUR-TRANSFORMER-UUID-HERE"
Invoke-RestMethod -Uri "http://localhost:8080/api/anomalies/history/transformer/$transformerId" -Method Get | ConvertTo-Json -Depth 10
```

**Expected response**: Array of detection records for that transformer

#### B. Get History by Date Range
```powershell
$startDate = "2025-10-01T00:00:00"
$endDate = "2025-10-31T23:59:59"
Invoke-RestMethod -Uri "http://localhost:8080/api/anomalies/history?startDate=$startDate&endDate=$endDate" -Method Get | ConvertTo-Json -Depth 10
```

**Expected response**: Array of detections within that date range

---

### ✅ Step 5: Verify Feedback Capability (Phase 3)

**When to check**: After at least one detection exists

**How to verify**:

```powershell
# Replace {detectionId} with actual UUID from database
$detectionId = "YOUR-DETECTION-UUID-HERE"

$body = @{
    correct = $true
    notes = "Test feedback - correctly identified hot bushing"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/anomalies/feedback/$detectionId" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
```

**Expected response**: Updated detection record with feedback fields populated

---

### ✅ Step 6: Quick Visual Verification Checklist

**Frontend fixes**:
- [ ] Inspection list shows actual dates (not "Invalid Date")
- [ ] Thermal images fit properly within their containers
- [ ] Annotated images (with bounding boxes) display correctly
- [ ] Zoom/pan controls work on both images

**Backend features**:
- [ ] `anomaly_detections` table created in database
- [ ] `/api/anomalies/health` endpoint returns engine status
- [ ] `/api/anomalies/engines` endpoint returns metadata
- [ ] Detection automatically saves to database
- [ ] History endpoints return detection records
- [ ] Feedback endpoint accepts inspector feedback

---

## Quick Test Sequence

### Complete End-to-End Test:

```powershell
# 1. Check backend health
Write-Host "`n=== Testing Backend Health ===" -ForegroundColor Green
Invoke-RestMethod -Uri "http://localhost:8080/api/anomalies/health" -Method Get | ConvertTo-Json

# 2. Check available engines
Write-Host "`n=== Available Engines ===" -ForegroundColor Green
Invoke-RestMethod -Uri "http://localhost:8080/api/anomalies/engines" -Method Get | ConvertTo-Json

# 3. Run a detection (replace URL with your image)
Write-Host "`n=== Running Detection ===" -ForegroundColor Green
$detectBody = @{
    imageUrl = "https://res.cloudinary.com/dtyjmwyrp/image/upload/v1759398379/pipeline_outputs/xgytdqjqosrbkjpmiflh.jpg"
} | ConvertTo-Json

$detection = Invoke-RestMethod -Uri "http://localhost:8080/api/anomalies/detect" -Method Post -Body $detectBody -ContentType "application/json"
$detection | ConvertTo-Json -Depth 10

Write-Host "`n✅ Detection completed! Record saved to database." -ForegroundColor Green
Write-Host "Check your database for the new record in anomaly_detections table" -ForegroundColor Yellow
```

---

## Database Quick Queries

```sql
-- 1. Check if table exists
SELECT COUNT(*) as record_count 
FROM anomaly_detections;

-- 2. View latest detection
SELECT 
  id,
  TO_CHAR(detected_at, 'YYYY-MM-DD HH24:MI:SS') as detected_at,
  engine_name || ' v' || engine_version as engine,
  total_detections,
  critical_count,
  warning_count,
  uncertain_count,
  ROUND(avg_confidence::numeric * 100, 1) || '%' as avg_conf,
  processing_time_ms || 'ms' as process_time
FROM anomaly_detections
ORDER BY detected_at DESC
LIMIT 5;

-- 3. Check feedback status
SELECT 
  COUNT(*) FILTER (WHERE feedback_provided = true) as with_feedback,
  COUNT(*) FILTER (WHERE feedback_provided = false) as needs_feedback,
  COUNT(*) as total
FROM anomaly_detections;

-- 4. Engine usage statistics
SELECT 
  engine_name,
  engine_version,
  COUNT(*) as detections,
  ROUND(AVG(avg_confidence)::numeric * 100, 1) as avg_confidence_pct,
  ROUND(AVG(processing_time_ms)::numeric) as avg_time_ms
FROM anomaly_detections
GROUP BY engine_name, engine_version
ORDER BY detections DESC;
```

---

## Troubleshooting

### Issue: Table Not Created
**Solution**: Check application.properties has `spring.jpa.hibernate.ddl-auto=update`

### Issue: Endpoints Return 404
**Solution**: Make sure backend compiled successfully. Check for Java compilation errors.

### Issue: No Records in Database After Detection
**Solution**: Check backend logs for exceptions during persistence. Ensure database connection is working.

### Issue: Health Endpoint Returns No Engines
**Solution**: Check that `AnomalyDetectionEngineFactory` is being instantiated. Look for log: "AnomalyDetectionEngineFactory initialized with X engine(s)"

---

## Success Indicators

You'll know everything is working when you see:

1. **In Backend Logs**:
   ```
   AnomalyDetectionEngineFactory initialized with 1 engine(s)
   Registered anomaly detection engine: HuggingFace v1.0.0
   Hibernate: create table anomaly_detections (...)
   ```

2. **In Database**:
   - Table `anomaly_detections` exists
   - Records appear after running detection
   - All metadata fields populated

3. **In API Responses**:
   - Health endpoint shows engines
   - History endpoints return records
   - Feedback endpoint updates records

4. **In Frontend**:
   - Dates display correctly in inspection list
   - Images fit properly in their containers
   - Zoom/pan controls work smoothly
   - Anomaly detections show complete metadata

---

**Last Updated**: October 3, 2025  
**Version**: 1.0
