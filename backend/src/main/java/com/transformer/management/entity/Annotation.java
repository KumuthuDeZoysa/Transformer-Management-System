package com.transformer.management.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.*;

/**
 * Entity to store user-created and edited annotations for bounding boxes
 * Supports Phase 3 Interactive Annotation & Feedback
 */
@Entity
@Table(name = "annotations", indexes = {
    @Index(name = "idx_anomaly_detection_id", columnList = "anomaly_detection_id"),
    @Index(name = "idx_image_id", columnList = "image_id"),
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
public class Annotation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "UUID DEFAULT gen_random_uuid()")
    private UUID id;

    // Reference to the anomaly detection result (if this is an edit to a detection)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "anomaly_detection_id")
    private AnomalyDetection anomalyDetection;

    // Reference to the image being annotated
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "image_id")
    private Image image;

    // Reference to the user who created/edited the annotation
    @Column(name = "user_id")
    private String userId; // Using String for flexibility (could be email, username, or UUID)

    // Bounding box coordinates
    @Column(name = "bbox_x", nullable = false)
    private Integer bboxX;

    @Column(name = "bbox_y", nullable = false)
    private Integer bboxY;

    @Column(name = "bbox_width", nullable = false)
    private Integer bboxWidth;

    @Column(name = "bbox_height", nullable = false)
    private Integer bboxHeight;

    // Annotation metadata
    @Column(name = "label")
    private String label; // e.g., "Hotspot", "Oil Leak", "Corrosion"

    @Column(name = "confidence")
    private Double confidence; // User-assigned confidence or original AI confidence

    @Column(name = "annotation_type")
    private String annotationType; // "AI_GENERATED", "USER_CREATED", "USER_EDITED", "USER_DELETED"

    @Column(name = "action")
    private String action; // "added", "edited", "deleted", "confirmed"

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes; // User notes about the annotation

    // Original detection reference (for tracking edits)
    @Column(name = "original_detection_id")
    private UUID originalDetectionId; // Reference to original AI detection if edited

    // Timestamps
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Metadata
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // Constructors
    public Annotation() {}

    public Annotation(Image image, String userId, Integer bboxX, Integer bboxY, 
                     Integer bboxWidth, Integer bboxHeight, String label, String action) {
        this.image = image;
        this.userId = userId;
        this.bboxX = bboxX;
        this.bboxY = bboxY;
        this.bboxWidth = bboxWidth;
        this.bboxHeight = bboxHeight;
        this.label = label;
        this.action = action;
        this.annotationType = "USER_CREATED";
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public AnomalyDetection getAnomalyDetection() { return anomalyDetection; }
    public void setAnomalyDetection(AnomalyDetection anomalyDetection) { this.anomalyDetection = anomalyDetection; }

    public Image getImage() { return image; }
    public void setImage(Image image) { this.image = image; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Integer getBboxX() { return bboxX; }
    public void setBboxX(Integer bboxX) { this.bboxX = bboxX; }

    public Integer getBboxY() { return bboxY; }
    public void setBboxY(Integer bboxY) { this.bboxY = bboxY; }

    public Integer getBboxWidth() { return bboxWidth; }
    public void setBboxWidth(Integer bboxWidth) { this.bboxWidth = bboxWidth; }

    public Integer getBboxHeight() { return bboxHeight; }
    public void setBboxHeight(Integer bboxHeight) { this.bboxHeight = bboxHeight; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }

    public String getAnnotationType() { return annotationType; }
    public void setAnnotationType(String annotationType) { this.annotationType = annotationType; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public UUID getOriginalDetectionId() { return originalDetectionId; }
    public void setOriginalDetectionId(UUID originalDetectionId) { this.originalDetectionId = originalDetectionId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean isDeleted) { this.isDeleted = isDeleted; }

    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
