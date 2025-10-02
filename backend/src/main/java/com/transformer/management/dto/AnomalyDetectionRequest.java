package com.transformer.management.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AnomalyDetectionRequest {
    @JsonProperty("imageUrl")
    private String imageUrl;

    public AnomalyDetectionRequest() {
    }

    public AnomalyDetectionRequest(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}
