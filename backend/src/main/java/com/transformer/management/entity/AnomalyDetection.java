package com.transformer.management.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.*;

/**
 * Entity to store anomaly detection results and metadata for Phase 3 retrieval and feedback
 * Supports evolution tracking and historical analysis
 */
@Entity
@Table(name = "anomaly_detections", indexes = {
    @Index(name = "idx_inspection_id", columnList = "inspection_id"),
    @Index(name = "idx_transformer_id", columnList = "transformer_id"),
    @Index(name = "idx_detected_at", columnList = "detected_at"),
    @Index(name = "idx_engine_name", columnList = "engine_name")
})
public class AnomalyDetection {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "UUID DEFAULT gen_random_uuid()")
    private UUID id;

    // Reference to inspection (optional - may be standalone detection)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id")
    private Inspection inspection;

    // Reference to transformer
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "transformer_id")
    private Transformer transformer;

    // Image URLs used for detection
    @Column(name = "baseline_image_url", columnDefinition = "TEXT")
    private String baselineImageUrl;

    @Column(name = "maintenance_image_url", columnDefinition = "TEXT")
    private String maintenanceImageUrl;

    // Detection engine metadata (for modular support)
    @Column(name = "engine_name", nullable = false)
    private String engineName; // e.g., "HuggingFace", "TensorFlow", "Custom-v2"

    @Column(name = "engine_version")
    private String engineVersion; // e.g., "1.0", "2.3.1"

    @Column(name = "model_name")
    private String modelName; // e.g., "thermal-anomaly-detector-v3"

    // Detection results
    @Column(name = "overall_label")
    private String overallLabel; // e.g., "Critical", "Warning", "Normal"

    @Column(name = "overlay_image_url", columnDefinition = "TEXT")
    private String overlayImageUrl; // Annotated image with bounding boxes

    @Column(name = "heatmap_image_url", columnDefinition = "TEXT")
    private String heatmapImageUrl;

    @Column(name = "mask_image_url", columnDefinition = "TEXT")
    private String maskImageUrl;

    // Detection metadata stored as JSON for flexibility
    @Column(name = "detections_json", columnDefinition = "TEXT")
    private String detectionsJson; // JSON array of all detections with bbox, confidence, type

    // Summary statistics
    @Column(name = "total_detections")
    private Integer totalDetections = 0;

    @Column(name = "critical_count")
    private Integer criticalCount = 0;

    @Column(name = "warning_count")
    private Integer warningCount = 0;

    @Column(name = "uncertain_count")
    private Integer uncertainCount = 0; // Detections with confidence < 60%

    @Column(name = "max_confidence")
    private Double maxConfidence;

    @Column(name = "min_confidence")
    private Double minConfidence;

    @Column(name = "avg_confidence")
    private Double avgConfidence;

    // Processing metadata
    @Column(name = "processing_time_ms")
    private Long processingTimeMs; // Time taken for detection

    @Column(name = "api_response_raw", columnDefinition = "TEXT")
    private String apiResponseRaw; // Store raw API response for debugging/feedback

    // Timestamps
    @Column(name = "detected_at", nullable = false)
    private LocalDateTime detectedAt = LocalDateTime.now();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Feedback fields for Phase 3
    @Column(name = "feedback_provided")
    private Boolean feedbackProvided = false;

    @Column(name = "feedback_correct")
    private Boolean feedbackCorrect; // Was the detection accurate?

    @Column(name = "feedback_notes", columnDefinition = "TEXT")
    private String feedbackNotes;

    @Column(name = "feedback_provided_at")
    private LocalDateTime feedbackProvidedAt;

    // Constructors
    public AnomalyDetection() {}

    public AnomalyDetection(Inspection inspection, Transformer transformer, 
                           String baselineImageUrl, String maintenanceImageUrl,
                           String engineName, String engineVersion) {
        this.inspection = inspection;
        this.transformer = transformer;
        this.baselineImageUrl = baselineImageUrl;
        this.maintenanceImageUrl = maintenanceImageUrl;
        this.engineName = engineName;
        this.engineVersion = engineVersion;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Inspection getInspection() { return inspection; }
    public void setInspection(Inspection inspection) { this.inspection = inspection; }

    public Transformer getTransformer() { return transformer; }
    public void setTransformer(Transformer transformer) { this.transformer = transformer; }

    public String getBaselineImageUrl() { return baselineImageUrl; }
    public void setBaselineImageUrl(String baselineImageUrl) { this.baselineImageUrl = baselineImageUrl; }

    public String getMaintenanceImageUrl() { return maintenanceImageUrl; }
    public void setMaintenanceImageUrl(String maintenanceImageUrl) { this.maintenanceImageUrl = maintenanceImageUrl; }

    public String getEngineName() { return engineName; }
    public void setEngineName(String engineName) { this.engineName = engineName; }

    public String getEngineVersion() { return engineVersion; }
    public void setEngineVersion(String engineVersion) { this.engineVersion = engineVersion; }

    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }

    public String getOverallLabel() { return overallLabel; }
    public void setOverallLabel(String overallLabel) { this.overallLabel = overallLabel; }

    public String getOverlayImageUrl() { return overlayImageUrl; }
    public void setOverlayImageUrl(String overlayImageUrl) { this.overlayImageUrl = overlayImageUrl; }

    public String getHeatmapImageUrl() { return heatmapImageUrl; }
    public void setHeatmapImageUrl(String heatmapImageUrl) { this.heatmapImageUrl = heatmapImageUrl; }

    public String getMaskImageUrl() { return maskImageUrl; }
    public void setMaskImageUrl(String maskImageUrl) { this.maskImageUrl = maskImageUrl; }

    public String getDetectionsJson() { return detectionsJson; }
    public void setDetectionsJson(String detectionsJson) { this.detectionsJson = detectionsJson; }

    public Integer getTotalDetections() { return totalDetections; }
    public void setTotalDetections(Integer totalDetections) { this.totalDetections = totalDetections; }

    public Integer getCriticalCount() { return criticalCount; }
    public void setCriticalCount(Integer criticalCount) { this.criticalCount = criticalCount; }

    public Integer getWarningCount() { return warningCount; }
    public void setWarningCount(Integer warningCount) { this.warningCount = warningCount; }

    public Integer getUncertainCount() { return uncertainCount; }
    public void setUncertainCount(Integer uncertainCount) { this.uncertainCount = uncertainCount; }

    public Double getMaxConfidence() { return maxConfidence; }
    public void setMaxConfidence(Double maxConfidence) { this.maxConfidence = maxConfidence; }

    public Double getMinConfidence() { return minConfidence; }
    public void setMinConfidence(Double minConfidence) { this.minConfidence = minConfidence; }

    public Double getAvgConfidence() { return avgConfidence; }
    public void setAvgConfidence(Double avgConfidence) { this.avgConfidence = avgConfidence; }

    public Long getProcessingTimeMs() { return processingTimeMs; }
    public void setProcessingTimeMs(Long processingTimeMs) { this.processingTimeMs = processingTimeMs; }

    public String getApiResponseRaw() { return apiResponseRaw; }
    public void setApiResponseRaw(String apiResponseRaw) { this.apiResponseRaw = apiResponseRaw; }

    public LocalDateTime getDetectedAt() { return detectedAt; }
    public void setDetectedAt(LocalDateTime detectedAt) { this.detectedAt = detectedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Boolean getFeedbackProvided() { return feedbackProvided; }
    public void setFeedbackProvided(Boolean feedbackProvided) { this.feedbackProvided = feedbackProvided; }

    public Boolean getFeedbackCorrect() { return feedbackCorrect; }
    public void setFeedbackCorrect(Boolean feedbackCorrect) { this.feedbackCorrect = feedbackCorrect; }

    public String getFeedbackNotes() { return feedbackNotes; }
    public void setFeedbackNotes(String feedbackNotes) { this.feedbackNotes = feedbackNotes; }

    public LocalDateTime getFeedbackProvidedAt() { return feedbackProvidedAt; }
    public void setFeedbackProvidedAt(LocalDateTime feedbackProvidedAt) { this.feedbackProvidedAt = feedbackProvidedAt; }
}
