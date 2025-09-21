package com.transformer.management.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "images")
public class Image {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "UUID DEFAULT gen_random_uuid()")
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "transformer_id", nullable = false)
    @JsonBackReference("transformer-images")
    private Transformer transformer;

    @Column(name = "url", nullable = false)
    private String url;

    @Column(name = "label")
    private String label;

    @Column(name = "image_type")
    private String imageType; // "baseline" or "maintenance"

    @Column(name = "uploader_name")
    private String uploaderName;

    @Column(name = "environmental_condition")
    private String environmentalCondition; // "sunny", "cloudy", "rainy"

    @Column(name = "comments")
    private String comments;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id")
    @JsonIgnoreProperties({"transformer", "images"})
    private Inspection inspection;

    @Column(name = "captured_at")
    private LocalDateTime capturedAt = LocalDateTime.now();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Constructors
    public Image() {}

    public Image(Transformer transformer, String url, String label) {
        this.transformer = transformer;
        this.url = url;
        this.label = label;
    }

    public Image(Transformer transformer, String url, String label, String imageType, 
                 String uploaderName, String environmentalCondition, String comments, Inspection inspection) {
        this.transformer = transformer;
        this.url = url;
        this.label = label;
        this.imageType = imageType;
        this.uploaderName = uploaderName;
        this.environmentalCondition = environmentalCondition;
        this.comments = comments;
        this.inspection = inspection;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Transformer getTransformer() { return transformer; }
    public void setTransformer(Transformer transformer) { this.transformer = transformer; }

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

    public Inspection getInspection() { return inspection; }
    public void setInspection(Inspection inspection) { this.inspection = inspection; }

    public LocalDateTime getCapturedAt() { return capturedAt; }
    public void setCapturedAt(LocalDateTime capturedAt) { this.capturedAt = capturedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
