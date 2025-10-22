package com.transformer.management.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.*;

/**
 * Dedicated entity for storing inspection annotations
 * Each record represents a bounding box annotation for a specific inspection
 * Stores both AI-detected and user-modified annotations
 */
@Entity
@Table(name = "inspection_annotations", indexes = {
    @Index(name = "idx_inspection_id", columnList = "inspection_id"),
    @Index(name = "idx_transformer_id", columnList = "transformer_id"),
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
public class InspectionAnnotation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "UUID DEFAULT gen_random_uuid()")
    private UUID id;

    // Inspection ID - used to group all annotations for an inspection
    @Column(name = "inspection_id", nullable = false, length = 255)
    private String inspectionId;

    // Transformer ID - for reference
    @Column(name = "transformer_id", length = 255)
    private String transformerId;

    // User who created or last modified this annotation
    @Column(name = "user_id", length = 255)
    private String userId;

    // Bounding box coordinates
    @Column(name = "bbox_x", nullable = false)
    private Integer bboxX;

    @Column(name = "bbox_y", nullable = false)
    private Integer bboxY;

    @Column(name = "bbox_width", nullable = false)
    private Integer bboxWidth;

    @Column(name = "bbox_height", nullable = false)
    private Integer bboxHeight;

    // Annotation details
    @Column(name = "label", length = 500)
    private String label;

    @Column(name = "confidence")
    private Double confidence;

    @Column(name = "severity", length = 50)
    private String severity; // "Critical", "Warning", "Uncertain"

    @Column(name = "color", length = 20)
    private String color; // Hex color code

    // Annotation metadata
    @Column(name = "action", length = 50)
    private String action; // "added", "edited", "deleted", "confirmed"

    @Column(name = "is_ai", nullable = false)
    private Boolean isAI = false; // True if AI-detected, False if user-created

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // Modification tracking
    @Column(name = "last_modified")
    private LocalDateTime lastModified;

    @Column(name = "modification_types", columnDefinition = "TEXT")
    private String modificationTypes; // Comma-separated: "created,resized,relocated"

    @Column(name = "modification_details", columnDefinition = "TEXT")
    private String modificationDetails; // Human-readable: "Resized, Relocated"

    // Timestamps
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Soft delete
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // Original AI detection data (stored as JSON string)
    @Column(name = "original_ai_data", columnDefinition = "TEXT")
    private String originalAiData;

    // Constructors
    public InspectionAnnotation() {}

    public InspectionAnnotation(String inspectionId, String transformerId, String userId,
                               Integer bboxX, Integer bboxY, Integer bboxWidth, Integer bboxHeight,
                               String label, Double confidence, String severity, String action, Boolean isAI) {
        this.inspectionId = inspectionId;
        this.transformerId = transformerId;
        this.userId = userId;
        this.bboxX = bboxX;
        this.bboxY = bboxY;
        this.bboxWidth = bboxWidth;
        this.bboxHeight = bboxHeight;
        this.label = label;
        this.confidence = confidence;
        this.severity = severity;
        this.action = action;
        this.isAI = isAI;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getInspectionId() { return inspectionId; }
    public void setInspectionId(String inspectionId) { this.inspectionId = inspectionId; }

    public String getTransformerId() { return transformerId; }
    public void setTransformerId(String transformerId) { this.transformerId = transformerId; }

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

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public Boolean getIsAI() { return isAI; }
    public void setIsAI(Boolean isAI) { this.isAI = isAI; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getLastModified() { return lastModified; }
    public void setLastModified(LocalDateTime lastModified) { this.lastModified = lastModified; }

    public String getModificationTypes() { return modificationTypes; }
    public void setModificationTypes(String modificationTypes) { this.modificationTypes = modificationTypes; }

    public String getModificationDetails() { return modificationDetails; }
    public void setModificationDetails(String modificationDetails) { this.modificationDetails = modificationDetails; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean isDeleted) { this.isDeleted = isDeleted; }

    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }

    public String getOriginalAiData() { return originalAiData; }
    public void setOriginalAiData(String originalAiData) { this.originalAiData = originalAiData; }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
