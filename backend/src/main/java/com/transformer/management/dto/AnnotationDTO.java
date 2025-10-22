package com.transformer.management.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for annotation data sent to/from frontend
 */
public class AnnotationDTO {
    private UUID id;
    private Integer x;
    private Integer y;
    private Integer width;
    private Integer height;
    private String label;
    private Double confidence;
    private String action; // "added", "edited", "deleted", "confirmed"
    private String annotationType; // "AI_GENERATED", "USER_CREATED", "USER_EDITED"
    private String notes;
    private String userId;
    private LocalDateTime timestamp;
    private UUID originalDetectionId;
    
    // New metadata fields
    private String severity; // "Critical", "Warning", "Uncertain"
    private String lastModified; // ISO timestamp string
    private List<String> modificationTypes; // ["created", "resized", "relocated", "label-changed", "deleted"]
    private String modificationDetails; // "Resized, Relocated"
    private Boolean isAI; // True if AI-generated, False if user-created
    private String imageId; // Inspection/image ID reference
    private String transformerId; // Transformer ID reference

    // Constructors
    public AnnotationDTO() {}

    public AnnotationDTO(UUID id, Integer x, Integer y, Integer width, Integer height, 
                        String label, String action) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.label = label;
        this.action = action;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Integer getX() { return x; }
    public void setX(Integer x) { this.x = x; }

    public Integer getY() { return y; }
    public void setY(Integer y) { this.y = y; }

    public Integer getWidth() { return width; }
    public void setWidth(Integer width) { this.width = width; }

    public Integer getHeight() { return height; }
    public void setHeight(Integer height) { this.height = height; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getAnnotationType() { return annotationType; }
    public void setAnnotationType(String annotationType) { this.annotationType = annotationType; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public UUID getOriginalDetectionId() { return originalDetectionId; }
    public void setOriginalDetectionId(UUID originalDetectionId) { this.originalDetectionId = originalDetectionId; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getLastModified() { return lastModified; }
    public void setLastModified(String lastModified) { this.lastModified = lastModified; }

    public List<String> getModificationTypes() { return modificationTypes; }
    public void setModificationTypes(List<String> modificationTypes) { this.modificationTypes = modificationTypes; }

    public String getModificationDetails() { return modificationDetails; }
    public void setModificationDetails(String modificationDetails) { this.modificationDetails = modificationDetails; }

    public Boolean getIsAI() { return isAI; }
    public void setIsAI(Boolean isAI) { this.isAI = isAI; }

    public String getImageId() { return imageId; }
    public void setImageId(String imageId) { this.imageId = imageId; }

    public String getTransformerId() { return transformerId; }
    public void setTransformerId(String transformerId) { this.transformerId = transformerId; }
}
