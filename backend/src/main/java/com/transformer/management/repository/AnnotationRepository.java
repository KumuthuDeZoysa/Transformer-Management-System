package com.transformer.management.repository;

import com.transformer.management.entity.Annotation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for managing annotation CRUD operations
 */
@Repository
public interface AnnotationRepository extends JpaRepository<Annotation, UUID> {
    
    /**
     * Find all annotations for a specific anomaly detection
     */
    List<Annotation> findByAnomalyDetectionId(UUID anomalyDetectionId);
    
    /**
     * Find all annotations for a specific image
     */
    List<Annotation> findByImageId(UUID imageId);
    
    /**
     * Find all annotations by a specific user
     */
    List<Annotation> findByUserId(String userId);
    
    /**
     * Find all non-deleted annotations for an image
     */
    @Query("SELECT a FROM Annotation a WHERE a.image.id = :imageId AND a.isDeleted = false")
    List<Annotation> findActiveAnnotationsByImageId(UUID imageId);
    
    /**
     * Find all annotations for a specific anomaly detection (including deleted)
     */
    @Query("SELECT a FROM Annotation a WHERE a.anomalyDetection.id = :detectionId ORDER BY a.createdAt DESC")
    List<Annotation> findByAnomalyDetectionIdOrderByCreatedAtDesc(UUID detectionId);
}
