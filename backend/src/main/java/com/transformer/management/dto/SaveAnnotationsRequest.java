package com.transformer.management.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Request DTO for saving annotation updates from the frontend
 */
public class SaveAnnotationsRequest {
    private String imageId;
    private String userId;
    private LocalDateTime timestamp;
    private List<AnnotationDTO> annotations;

    // Constructors
    public SaveAnnotationsRequest() {}

    public SaveAnnotationsRequest(String imageId, String userId, List<AnnotationDTO> annotations) {
        this.imageId = imageId;
        this.userId = userId;
        this.annotations = annotations;
        this.timestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public String getImageId() { return imageId; }
    public void setImageId(String imageId) { this.imageId = imageId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public List<AnnotationDTO> getAnnotations() { return annotations; }
    public void setAnnotations(List<AnnotationDTO> annotations) { this.annotations = annotations; }
}
