package com.transformer.management.repository;

import com.transformer.management.entity.Image;
import com.transformer.management.entity.Transformer;
import com.transformer.management.enums.ImageType;
import com.transformer.management.enums.WeatherCondition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for Image entity
 * Provides CRUD operations and custom query methods
 */
@Repository
public interface ImageRepository extends JpaRepository<Image, Long> {

    /**
     * Find all images for a specific transformer
     * @param transformer The transformer entity
     * @return List of images associated with the transformer
     */
    List<Image> findByTransformer(Transformer transformer);

    /**
     * Find all images for a specific transformer by transformer ID
     * @param transformerId The transformer ID
     * @return List of images associated with the transformer
     */
    List<Image> findByTransformerTransformerId(String transformerId);

    /**
     * Find images by image type
     * @param imageType The type of image (BASELINE or MAINTENANCE)
     * @return List of images of the specified type
     */
    List<Image> findByImageType(ImageType imageType);

    /**
     * Find images by weather condition
     * @param condition The weather condition when image was taken
     * @return List of images taken under the specified condition
     */
    List<Image> findByCondition(WeatherCondition condition);

    /**
     * Find images by uploader
     * @param uploader The person who uploaded the images
     * @return List of images uploaded by the specified person
     */
    List<Image> findByUploader(String uploader);

    /**
     * Find images by transformer and image type
     * @param transformer The transformer entity
     * @param imageType The type of image
     * @return List of images matching both criteria
     */
    List<Image> findByTransformerAndImageType(Transformer transformer, ImageType imageType);

    /**
     * Find images by transformer ID and image type
     * @param transformerId The transformer ID
     * @param imageType The type of image
     * @return List of images matching both criteria
     */
    List<Image> findByTransformerTransformerIdAndImageType(String transformerId, ImageType imageType);

    /**
     * Find images uploaded within a date range
     * @param startDate Start date of the range
     * @param endDate End date of the range
     * @return List of images uploaded within the specified range
     */
    List<Image> findByUploadTimeBetween(Timestamp startDate, Timestamp endDate);

    /**
     * Find latest image for a transformer
     * @param transformer The transformer entity
     * @return Optional containing the most recently uploaded image
     */
    @Query("SELECT i FROM Image i WHERE i.transformer = :transformer ORDER BY i.uploadTime DESC LIMIT 1")
    Optional<Image> findLatestImageByTransformer(@Param("transformer") Transformer transformer);

    /**
     * Find latest image for a transformer by transformer ID
     * @param transformerId The transformer ID
     * @return Optional containing the most recently uploaded image
     */
    @Query("SELECT i FROM Image i WHERE i.transformer.transformerId = :transformerId ORDER BY i.uploadTime DESC LIMIT 1")
    Optional<Image> findLatestImageByTransformerId(@Param("transformerId") String transformerId);

    /**
     * Count images by transformer
     * @param transformer The transformer entity
     * @return Number of images associated with the transformer
     */
    long countByTransformer(Transformer transformer);

    /**
     * Count images by transformer ID
     * @param transformerId The transformer ID
     * @return Number of images associated with the transformer
     */
    long countByTransformerTransformerId(String transformerId);

    /**
     * Count images by image type
     * @param imageType The type of image
     * @return Number of images of the specified type
     */
    long countByImageType(ImageType imageType);

    /**
     * Find all images ordered by upload time (newest first)
     * @return List of all images ordered by upload time descending
     */
    @Query("SELECT i FROM Image i ORDER BY i.uploadTime DESC")
    List<Image> findAllOrderByUploadTimeDesc();

    /**
     * Find images by transformer and condition
     * @param transformer The transformer entity
     * @param condition The weather condition
     * @return List of images matching both criteria
     */
    List<Image> findByTransformerAndCondition(Transformer transformer, WeatherCondition condition);

    /**
     * Find images by multiple criteria
     * @param transformer The transformer entity
     * @param imageType The type of image
     * @param condition The weather condition
     * @return List of images matching all criteria
     */
    List<Image> findByTransformerAndImageTypeAndCondition(Transformer transformer, ImageType imageType, WeatherCondition condition);

    /**
     * Delete all images for a specific transformer
     * @param transformer The transformer entity
     */
    void deleteByTransformer(Transformer transformer);

    /**
     * Delete all images for a transformer by transformer ID
     * @param transformerId The transformer ID
     */
    void deleteByTransformerTransformerId(String transformerId);

    /**
     * Check if any images exist for a transformer
     * @param transformer The transformer entity
     * @return true if images exist, false otherwise
     */
    boolean existsByTransformer(Transformer transformer);

    /**
     * Find images by URL pattern (useful for cleanup operations)
     * @param urlPattern The URL pattern to search for
     * @return List of images with URLs matching the pattern
     */
    List<Image> findByImageUrlContaining(String urlPattern);
}
