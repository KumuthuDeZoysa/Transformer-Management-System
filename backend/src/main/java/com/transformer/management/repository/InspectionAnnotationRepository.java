package com.transformer.management.repository;

import com.transformer.management.entity.InspectionAnnotation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Repository for managing inspection annotation CRUD operations
 */
@Repository
public interface InspectionAnnotationRepository extends JpaRepository<InspectionAnnotation, UUID> {
    
    /**
     * Find all annotations for a specific inspection (including deleted)
     */
    List<InspectionAnnotation> findByInspectionIdOrderByCreatedAtDesc(String inspectionId);
    
    /**
     * Find all active (non-deleted) annotations for an inspection
     */
    @Query("SELECT ia FROM InspectionAnnotation ia WHERE ia.inspectionId = :inspectionId AND ia.isDeleted = false ORDER BY ia.createdAt DESC")
    List<InspectionAnnotation> findActiveByInspectionId(String inspectionId);
    
    /**
     * Find all annotations for a specific transformer
     */
    List<InspectionAnnotation> findByTransformerId(String transformerId);
    
    /**
     * Find all annotations by a specific user
     */
    List<InspectionAnnotation> findByUserId(String userId);
    
    /**
     * Delete all annotations for a specific inspection
     * Used when re-running AI detection to start fresh
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM InspectionAnnotation ia WHERE ia.inspectionId = :inspectionId")
    void deleteByInspectionId(String inspectionId);
    
    /**
     * Count annotations for an inspection
     */
    long countByInspectionId(String inspectionId);
    
    /**
     * Check if annotations exist for an inspection
     */
    boolean existsByInspectionId(String inspectionId);
}
