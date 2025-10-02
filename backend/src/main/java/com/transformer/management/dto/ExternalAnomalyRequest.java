package com.transformer.management.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO for sending requests to the external anomaly detection API
 * The external API expects: { "image_url": "<url>" }
 */
public class ExternalAnomalyRequest {
    @JsonProperty("image_url")
    private String imageUrl;

    public ExternalAnomalyRequest() {
    }

    public ExternalAnomalyRequest(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}
