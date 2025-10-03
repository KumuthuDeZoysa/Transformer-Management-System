package com.transformer.management.repository;

import com.transformer.management.entity.AnomalyDetection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository for accessing anomaly detection history and metadata
 * Supports Phase 3 retrieval and feedback requirements
 */
@Repository
public interface AnomalyDetectionRepository extends JpaRepository<AnomalyDetection, UUID> {
    
    // Find all detections for a specific inspection
    List<AnomalyDetection> findByInspectionId(UUID inspectionId);
    
    // Find all detections for a specific transformer
    List<AnomalyDetection> findByTransformerId(UUID transformerId);
    
    // Find all detections for a specific transformer, ordered by date (most recent first)
    List<AnomalyDetection> findByTransformerIdOrderByDetectedAtDesc(UUID transformerId);
    
    // Find detections by engine name (for comparing different detection engines)
    List<AnomalyDetection> findByEngineName(String engineName);
    
    // Find detections by engine name and version
    List<AnomalyDetection> findByEngineNameAndEngineVersion(String engineName, String engineVersion);
    
    // Find detections within a date range
    @Query("SELECT ad FROM AnomalyDetection ad WHERE ad.detectedAt BETWEEN :startDate AND :endDate ORDER BY ad.detectedAt DESC")
    List<AnomalyDetection> findByDetectedAtBetween(
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate
    );
    
    // Find detections for a transformer within a date range
    @Query("SELECT ad FROM AnomalyDetection ad WHERE ad.transformer.id = :transformerId AND ad.detectedAt BETWEEN :startDate AND :endDate ORDER BY ad.detectedAt DESC")
    List<AnomalyDetection> findByTransformerAndDateRange(
        @Param("transformerId") UUID transformerId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    // Find detections with critical anomalies (criticalCount > 0)
    @Query("SELECT ad FROM AnomalyDetection ad WHERE ad.criticalCount > 0 ORDER BY ad.detectedAt DESC")
    List<AnomalyDetection> findCriticalDetections();
    
    // Find detections with uncertain results (uncertainCount > 0)
    @Query("SELECT ad FROM AnomalyDetection ad WHERE ad.uncertainCount > 0 ORDER BY ad.detectedAt DESC")
    List<AnomalyDetection> findUncertainDetections();
    
    // Find detections with high confidence (avgConfidence >= threshold)
    @Query("SELECT ad FROM AnomalyDetection ad WHERE ad.avgConfidence >= :threshold ORDER BY ad.avgConfidence DESC")
    List<AnomalyDetection> findHighConfidenceDetections(@Param("threshold") Double threshold);
    
    // Find detections with low confidence (avgConfidence < threshold)
    @Query("SELECT ad FROM AnomalyDetection ad WHERE ad.avgConfidence < :threshold ORDER BY ad.avgConfidence ASC")
    List<AnomalyDetection> findLowConfidenceDetections(@Param("threshold") Double threshold);
    
    // Find detections that have feedback provided (for Phase 3 training)
    @Query("SELECT ad FROM AnomalyDetection ad WHERE ad.feedbackProvided = true ORDER BY ad.feedbackProvidedAt DESC")
    List<AnomalyDetection> findDetectionsWithFeedback();
    
    // Find detections that need feedback (no feedback provided yet)
    @Query("SELECT ad FROM AnomalyDetection ad WHERE ad.feedbackProvided = false ORDER BY ad.detectedAt DESC")
    List<AnomalyDetection> findDetectionsNeedingFeedback();
    
    // Find detections with correct feedback (for model validation)
    @Query("SELECT ad FROM AnomalyDetection ad WHERE ad.feedbackProvided = true AND ad.feedbackCorrect = true")
    List<AnomalyDetection> findCorrectDetections();
    
    // Find detections with incorrect feedback (for model improvement)
    @Query("SELECT ad FROM AnomalyDetection ad WHERE ad.feedbackProvided = true AND ad.feedbackCorrect = false")
    List<AnomalyDetection> findIncorrectDetections();
    
    // Get latest detection for a transformer
    @Query("SELECT ad FROM AnomalyDetection ad WHERE ad.transformer.id = :transformerId ORDER BY ad.detectedAt DESC")
    List<AnomalyDetection> findLatestByTransformer(@Param("transformerId") UUID transformerId);
    
    // Get detection statistics by engine
    @Query("SELECT ad.engineName, COUNT(ad), AVG(ad.avgConfidence), AVG(ad.processingTimeMs) " +
           "FROM AnomalyDetection ad GROUP BY ad.engineName")
    List<Object[]> getDetectionStatsByEngine();
    
    // Count detections by transformer
    @Query("SELECT COUNT(ad) FROM AnomalyDetection ad WHERE ad.transformer.id = :transformerId")
    Long countByTransformer(@Param("transformerId") UUID transformerId);
    
    // Count critical detections for a transformer
    @Query("SELECT COUNT(ad) FROM AnomalyDetection ad WHERE ad.transformer.id = :transformerId AND ad.criticalCount > 0")
    Long countCriticalByTransformer(@Param("transformerId") UUID transformerId);
}
