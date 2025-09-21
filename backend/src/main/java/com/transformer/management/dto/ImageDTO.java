package com.transformer.management.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class ImageDTO {
    private UUID id;
    private String url;
    private String label;
    private String imageType;
    private String uploaderName;
    private String environmentalCondition;
    private String comments;
    private LocalDateTime capturedAt;
    private LocalDateTime createdAt;
    
    // Transformer info (avoid circular reference)
    private UUID transformerId;
    private String transformerCode;
    
    // Inspection info (avoid circular reference)
    private UUID inspectionId;
    private String inspectionNo;

    // Constructors
    public ImageDTO() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getImageType() { return imageType; }
    public void setImageType(String imageType) { this.imageType = imageType; }

    public String getUploaderName() { return uploaderName; }
    public void setUploaderName(String uploaderName) { this.uploaderName = uploaderName; }

    public String getEnvironmentalCondition() { return environmentalCondition; }
    public void setEnvironmentalCondition(String environmentalCondition) { this.environmentalCondition = environmentalCondition; }

    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }

    public LocalDateTime getCapturedAt() { return capturedAt; }
    public void setCapturedAt(LocalDateTime capturedAt) { this.capturedAt = capturedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public UUID getTransformerId() { return transformerId; }
    public void setTransformerId(UUID transformerId) { this.transformerId = transformerId; }

    public String getTransformerCode() { return transformerCode; }
    public void setTransformerCode(String transformerCode) { this.transformerCode = transformerCode; }

    public UUID getInspectionId() { return inspectionId; }
    public void setInspectionId(UUID inspectionId) { this.inspectionId = inspectionId; }

    public String getInspectionNo() { return inspectionNo; }
    public void setInspectionNo(String inspectionNo) { this.inspectionNo = inspectionNo; }
}