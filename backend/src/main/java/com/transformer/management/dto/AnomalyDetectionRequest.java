package com.transformer.management.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AnomalyDetectionRequest {
    @JsonProperty("imageUrl")
    private String imageUrl;
    
    @JsonProperty("inspectionId")
    private String inspectionId;

    public AnomalyDetectionRequest() {
    }

    public AnomalyDetectionRequest(String imageUrl) {
        this.imageUrl = imageUrl;
    }
    
    public AnomalyDetectionRequest(String imageUrl, String inspectionId) {
        this.imageUrl = imageUrl;
        this.inspectionId = inspectionId;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
    
    public String getInspectionId() {
        return inspectionId;
    }
    
    public void setInspectionId(String inspectionId) {
        this.inspectionId = inspectionId;
    }
}
