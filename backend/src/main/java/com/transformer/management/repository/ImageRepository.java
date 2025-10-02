package com.transformer.management.repository;

import java.util.UUID;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.transformer.management.entity.Image;

@Repository
public interface ImageRepository extends JpaRepository<Image, UUID> {
    // Find images by transformer ID
    List<Image> findByTransformerId(UUID transformerId);
    
    // Find images by image type
    List<Image> findByImageType(String imageType);
    
    // Find images by inspection ID
    List<Image> findByInspectionId(UUID inspectionId);
    
    // Find images by transformer and image type
    List<Image> findByTransformerIdAndImageType(UUID transformerId, String imageType);
    
    // Find the most recent baseline image by transformer (sorted by capturedAt descending)
    List<Image> findByTransformerIdAndImageTypeOrderByCapturedAtDesc(UUID transformerId, String imageType);
    
    // Find baseline image by inspection ID
    List<Image> findByInspectionIdAndImageType(UUID inspectionId, String imageType);
    
    // Find images by transformer and inspection
    List<Image> findByTransformerIdAndInspectionId(UUID transformerId, UUID inspectionId);
}
