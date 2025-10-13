package com.transformer.management.dto;

import java.util.List;

/**
 * DTO for anomaly detection response sent to frontend
 * Maps the external API response to a more user-friendly format
 */
public class AnomalyDetectionDTO {
    private String originalImage;     // Original image URL (without annotations)
    private String overlayImage;      // boxed_url from external API
    private String heatmapImage;      // filtered_url from external API
    private String maskImage;         // mask_url from external API
    private String label;             // label from external API
    private List<Detection> detections; // boxes from external API

    public AnomalyDetectionDTO() {
    }

    public AnomalyDetectionDTO(String overlayImage, String heatmapImage, String maskImage, 
                               String label, List<Detection> detections) {
        this.overlayImage = overlayImage;
        this.heatmapImage = heatmapImage;
        this.maskImage = maskImage;
        this.label = label;
        this.detections = detections;
    }

    // Getters and setters
    public String getOriginalImage() {
        return originalImage;
    }

    public void setOriginalImage(String originalImage) {
        this.originalImage = originalImage;
    }

    public String getOverlayImage() {
        return overlayImage;
    }

    public void setOverlayImage(String overlayImage) {
        this.overlayImage = overlayImage;
    }

    public String getHeatmapImage() {
        return heatmapImage;
    }

    public void setHeatmapImage(String heatmapImage) {
        this.heatmapImage = heatmapImage;
    }

    public String getMaskImage() {
        return maskImage;
    }

    public void setMaskImage(String maskImage) {
        this.maskImage = maskImage;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public List<Detection> getDetections() {
        return detections;
    }

    public void setDetections(List<Detection> detections) {
        this.detections = detections;
    }

    /**
     * Inner class representing a single detection/bounding box
     */
    public static class Detection {
        private int[] bbox; // [x, y, width, height]
        private String type;
        private double confidence; // Confidence score (0-1 range)

        public Detection() {
        }

        public Detection(int[] bbox, String type, double confidence) {
            this.bbox = bbox;
            this.type = type;
            this.confidence = confidence;
        }

        public int[] getBbox() {
            return bbox;
        }

        public void setBbox(int[] bbox) {
            this.bbox = bbox;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public double getConfidence() {
            return confidence;
        }

        public void setConfidence(double confidence) {
            this.confidence = confidence;
        }
    }
}
