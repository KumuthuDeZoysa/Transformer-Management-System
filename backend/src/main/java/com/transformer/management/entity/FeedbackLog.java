package com.transformer.management.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.*;

/**
 * Entity for storing user feedback on AI-generated anomaly detections
 */
@Entity
@Table(name = "feedback_logs", indexes = {
    @Index(name = "idx_feedback_image_id", columnList = "image_id"),
    @Index(name = "idx_feedback_created_at", columnList = "created_at")
})
public class FeedbackLog {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "UUID DEFAULT gen_random_uuid()")
    private UUID id;

    @Column(name = "image_id", nullable = false, length = 255)
    private String imageId;

    // Store JSON payloads as text in the entity; DB column will be JSONB
    @Column(name = "model_predicted_anomalies", columnDefinition = "TEXT")
    private String modelPredictedAnomalies;

    @Column(name = "final_accepted_annotations", columnDefinition = "TEXT")
    private String finalAcceptedAnnotations;

    @Column(name = "annotator_metadata", columnDefinition = "TEXT")
    private String annotatorMetadata;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Constructors
    public FeedbackLog() {}

    public FeedbackLog(String imageId, String modelPredictedAnomalies, String finalAcceptedAnnotations, String annotatorMetadata) {
        this.imageId = imageId;
        this.modelPredictedAnomalies = modelPredictedAnomalies;
        this.finalAcceptedAnnotations = finalAcceptedAnnotations;
        this.annotatorMetadata = annotatorMetadata;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getImageId() { return imageId; }
    public void setImageId(String imageId) { this.imageId = imageId; }

    public String getModelPredictedAnomalies() { return modelPredictedAnomalies; }
    public void setModelPredictedAnomalies(String modelPredictedAnomalies) { this.modelPredictedAnomalies = modelPredictedAnomalies; }

    public String getFinalAcceptedAnnotations() { return finalAcceptedAnnotations; }
    public void setFinalAcceptedAnnotations(String finalAcceptedAnnotations) { this.finalAcceptedAnnotations = finalAcceptedAnnotations; }

    public String getAnnotatorMetadata() { return annotatorMetadata; }
    public void setAnnotatorMetadata(String annotatorMetadata) { this.annotatorMetadata = annotatorMetadata; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
