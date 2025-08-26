package com.transformer.management.service;

import com.transformer.management.entity.Image;
import com.transformer.management.entity.Transformer;
import com.transformer.management.enums.ImageType;
import com.transformer.management.enums.WeatherCondition;
import com.transformer.management.repository.ImageRepository;
import com.transformer.management.repository.TransformerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

/**
 * Service class for Image operations
 * Provides methods to upload image metadata and list images by transformer
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ImageService {

    private final ImageRepository imageRepository;
    private final TransformerRepository transformerRepository;

    /**
     * Upload image metadata to the system
     * @param transformerId The ID of the transformer this image belongs to
     * @param imageUrl The URL where the image is stored
     * @param imageType The type of image (BASELINE or MAINTENANCE)
     * @param condition The weather condition when image was taken
     * @param uploader The person uploading the image
     * @return The saved image metadata
     * @throws IllegalArgumentException if transformer doesn't exist
     */
    public Image uploadImageMetadata(String transformerId, String imageUrl, ImageType imageType, 
                                   WeatherCondition condition, String uploader) {
        // Find the transformer
        Optional<Transformer> transformer = transformerRepository.findByTransformerId(transformerId);
        if (transformer.isEmpty()) {
            throw new IllegalArgumentException("Transformer with ID " + transformerId + " does not exist");
        }

        // Create and save image metadata
        Image image = new Image();
        image.setTransformer(transformer.get());
        image.setImageUrl(imageUrl);
        image.setImageType(imageType);
        image.setCondition(condition);
        image.setUploader(uploader);

        return imageRepository.save(image);
    }

    /**
     * Upload image metadata with Transformer entity
     * @param transformer The transformer entity this image belongs to
     * @param imageUrl The URL where the image is stored
     * @param imageType The type of image (BASELINE or MAINTENANCE)
     * @param condition The weather condition when image was taken
     * @param uploader The person uploading the image
     * @return The saved image metadata
     */
    public Image uploadImageMetadata(Transformer transformer, String imageUrl, ImageType imageType, 
                                   WeatherCondition condition, String uploader) {
        Image image = new Image();
        image.setTransformer(transformer);
        image.setImageUrl(imageUrl);
        image.setImageType(imageType);
        image.setCondition(condition);
        image.setUploader(uploader);

        return imageRepository.save(image);
    }

    /**
     * Find image by ID
     * @param id The image database ID
     * @return Optional containing the image if found
     */
    @Transactional(readOnly = true)
    public Optional<Image> findById(Long id) {
        return imageRepository.findById(id);
    }

    /**
     * Get all images
     * @return List of all images ordered by upload time (newest first)
     */
    @Transactional(readOnly = true)
    public List<Image> getAllImages() {
        return imageRepository.findAllOrderByUploadTimeDesc();
    }

    /**
     * List all images for a specific transformer by transformer ID
     * @param transformerId The transformer ID
     * @return List of images associated with the transformer, ordered by upload time (newest first)
     */
    @Transactional(readOnly = true)
    public List<Image> listImagesByTransformerId(String transformerId) {
        return imageRepository.findByTransformerTransformerId(transformerId);
    }

    /**
     * List all images for a specific transformer entity
     * @param transformer The transformer entity
     * @return List of images associated with the transformer, ordered by upload time (newest first)
     */
    @Transactional(readOnly = true)
    public List<Image> listImagesByTransformer(Transformer transformer) {
        return imageRepository.findByTransformer(transformer);
    }

    /**
     * List images by transformer ID and image type
     * @param transformerId The transformer ID
     * @param imageType The type of image to filter by
     * @return List of images matching the criteria
     */
    @Transactional(readOnly = true)
    public List<Image> listImagesByTransformerAndType(String transformerId, ImageType imageType) {
        return imageRepository.findByTransformerTransformerIdAndImageType(transformerId, imageType);
    }

    /**
     * Get images by type
     * @param imageType The type of image (BASELINE or MAINTENANCE)
     * @return List of images of the specified type
     */
    @Transactional(readOnly = true)
    public List<Image> getImagesByType(ImageType imageType) {
        return imageRepository.findByImageType(imageType);
    }

    /**
     * Get images by weather condition
     * @param condition The weather condition
     * @return List of images taken under the specified condition
     */
    @Transactional(readOnly = true)
    public List<Image> getImagesByCondition(WeatherCondition condition) {
        return imageRepository.findByCondition(condition);
    }

    /**
     * Get images by uploader
     * @param uploader The person who uploaded the images
     * @return List of images uploaded by the specified person
     */
    @Transactional(readOnly = true)
    public List<Image> getImagesByUploader(String uploader) {
        return imageRepository.findByUploader(uploader);
    }

    /**
     * Get images by transformer and type
     * @param transformer The transformer entity
     * @param imageType The type of image
     * @return List of images matching both criteria
     */
    @Transactional(readOnly = true)
    public List<Image> getImagesByTransformerAndType(Transformer transformer, ImageType imageType) {
        return imageRepository.findByTransformerAndImageType(transformer, imageType);
    }

    /**
     * Get latest image for a transformer
     * @param transformer The transformer entity
     * @return Optional containing the most recently uploaded image
     */
    @Transactional(readOnly = true)
    public Optional<Image> getLatestImageByTransformer(Transformer transformer) {
        return imageRepository.findLatestImageByTransformer(transformer);
    }

    /**
     * Get latest image for a transformer by ID
     * @param transformerId The transformer ID
     * @return Optional containing the most recently uploaded image
     */
    @Transactional(readOnly = true)
    public Optional<Image> getLatestImageByTransformerId(String transformerId) {
        return imageRepository.findLatestImageByTransformerId(transformerId);
    }

    /**
     * Get images within a date range
     * @param startDate Start date of the range
     * @param endDate End date of the range
     * @return List of images uploaded within the specified range
     */
    @Transactional(readOnly = true)
    public List<Image> getImagesInDateRange(Timestamp startDate, Timestamp endDate) {
        return imageRepository.findByUploadTimeBetween(startDate, endDate);
    }

    /**
     * Update an existing image
     * @param image The image to update
     * @return The updated image
     */
    public Image updateImage(Image image) {
        return imageRepository.save(image);
    }

    /**
     * Delete image by ID
     * @param id The image database ID
     */
    public void deleteImage(Long id) {
        imageRepository.deleteById(id);
    }

    /**
     * Delete all images for a transformer
     * @param transformer The transformer entity
     */
    public void deleteImagesByTransformer(Transformer transformer) {
        imageRepository.deleteByTransformer(transformer);
    }

    /**
     * Delete all images for a transformer by ID
     * @param transformerId The transformer ID
     */
    public void deleteImagesByTransformerId(String transformerId) {
        imageRepository.deleteByTransformerTransformerId(transformerId);
    }

    /**
     * Count images by transformer
     * @param transformer The transformer entity
     * @return Number of images associated with the transformer
     */
    @Transactional(readOnly = true)
    public long countImagesByTransformer(Transformer transformer) {
        return imageRepository.countByTransformer(transformer);
    }

    /**
     * Count images by transformer ID
     * @param transformerId The transformer ID
     * @return Number of images associated with the transformer
     */
    @Transactional(readOnly = true)
    public long countImagesByTransformerId(String transformerId) {
        return imageRepository.countByTransformerTransformerId(transformerId);
    }

    /**
     * Count images by type
     * @param imageType The type of image
     * @return Number of images of the specified type
     */
    @Transactional(readOnly = true)
    public long countImagesByType(ImageType imageType) {
        return imageRepository.countByImageType(imageType);
    }

    /**
     * Check if images exist for a transformer
     * @param transformer The transformer entity
     * @return true if images exist, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean hasImages(Transformer transformer) {
        return imageRepository.existsByTransformer(transformer);
    }

    /**
     * Check if transformer has any images by transformer ID
     * @param transformerId The transformer ID
     * @return true if transformer has images, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean hasImagesByTransformerId(String transformerId) {
        return imageRepository.countByTransformerTransformerId(transformerId) > 0;
    }
}
