package com.transformer.management.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "maintenance_records")
public class MaintenanceRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "UUID DEFAULT gen_random_uuid()")
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "inspection_id", nullable = false)
    private Inspection inspection;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "transformer_id", nullable = false)
    private Transformer transformer;

    @Column(name = "inspector_name")
    private String inspectorName;

    @Column(name = "transformer_status")
    private String transformerStatus; // OK, Needs Maintenance, Urgent Attention

    @Column(name = "voltage_reading")
    private String voltageReading;

    @Column(name = "current_reading")
    private String currentReading;

    @Column(name = "power_factor")
    private String powerFactor;

    @Column(name = "temperature")
    private String temperature;

    @Column(name = "recommended_action", length = 1000)
    private String recommendedAction;

    @Column(name = "additional_remarks", length = 2000)
    private String additionalRemarks;

    @Column(name = "completion_date")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime completionDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Constructors
    public MaintenanceRecord() {}

    public MaintenanceRecord(Inspection inspection, Transformer transformer, String inspectorName, String transformerStatus) {
        this.inspection = inspection;
        this.transformer = transformer;
        this.inspectorName = inspectorName;
        this.transformerStatus = transformerStatus;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Inspection getInspection() { return inspection; }
    public void setInspection(Inspection inspection) { this.inspection = inspection; }

    public Transformer getTransformer() { return transformer; }
    public void setTransformer(Transformer transformer) { this.transformer = transformer; }

    public String getInspectorName() { return inspectorName; }
    public void setInspectorName(String inspectorName) { this.inspectorName = inspectorName; }

    public String getTransformerStatus() { return transformerStatus; }
    public void setTransformerStatus(String transformerStatus) { this.transformerStatus = transformerStatus; }

    public String getVoltageReading() { return voltageReading; }
    public void setVoltageReading(String voltageReading) { this.voltageReading = voltageReading; }

    public String getCurrentReading() { return currentReading; }
    public void setCurrentReading(String currentReading) { this.currentReading = currentReading; }

    public String getPowerFactor() { return powerFactor; }
    public void setPowerFactor(String powerFactor) { this.powerFactor = powerFactor; }

    public String getTemperature() { return temperature; }
    public void setTemperature(String temperature) { this.temperature = temperature; }

    public String getRecommendedAction() { return recommendedAction; }
    public void setRecommendedAction(String recommendedAction) { this.recommendedAction = recommendedAction; }

    public String getAdditionalRemarks() { return additionalRemarks; }
    public void setAdditionalRemarks(String additionalRemarks) { this.additionalRemarks = additionalRemarks; }

    public LocalDateTime getCompletionDate() { return completionDate; }
    public void setCompletionDate(LocalDateTime completionDate) { this.completionDate = completionDate; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
