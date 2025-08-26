package com.transformer.management.controller;

import com.transformer.management.dto.ImageUploadRequest;
import com.transformer.management.entity.Image;
import com.transformer.management.entity.Transformer;
import com.transformer.management.enums.ImageType;
import com.transformer.management.enums.WeatherCondition;
import com.transformer.management.service.ImageService;
import com.transformer.management.service.TransformerService;
import com.transformer.management.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * REST Controller for Image operations
 */
@RestController
@RequestMapping("/transformers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ImageController {

    private final ImageService imageService;
    private final TransformerService transformerService;
    private final CloudinaryService cloudinaryService;

    /**
     * Upload image for a transformer
     * POST /transformers/{id}/images
     *
     * @param id The transformer database ID
     * @param file The image file to upload
     * @param imageType The type of image (BASELINE or MAINTENANCE)
     * @param condition The weather condition when image was taken
     * @param uploader The person uploading the image
     * @return Uploaded image metadata with 201 status
     */
    @PostMapping("/{id}/images")
    public ResponseEntity<Image> uploadImage(
            @PathVariable("id") Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam("imageType") ImageType imageType,
            @RequestParam("condition") WeatherCondition condition,
            @RequestParam("uploader") String uploader) {
        
        try {
            // Check if transformer exists
            Optional<Transformer> transformer = transformerService.findById(id);
            if (transformer.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

            // Validate file
            if (file.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }

            // Upload file to Cloudinary
            String imageUrl = cloudinaryService.uploadImageAndGetSecureUrl(file);

            // Save image metadata to database
            Image savedImage = imageService.uploadImageMetadata(
                transformer.get(),
                imageUrl,
                imageType,
                condition,
                uploader
            );

            return new ResponseEntity<>(savedImage, HttpStatus.CREATED);

        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Upload image for a transformer by transformer ID
     * POST /transformers/by-transformer-id/{transformerId}/images
     *
     * @param transformerId The unique transformer identifier
     * @param file The image file to upload
     * @param imageType The type of image (BASELINE or MAINTENANCE)
     * @param condition The weather condition when image was taken
     * @param uploader The person uploading the image
     * @return Uploaded image metadata with 201 status
     */
    @PostMapping("/by-transformer-id/{transformerId}/images")
    public ResponseEntity<Image> uploadImageByTransformerId(
            @PathVariable("transformerId") String transformerId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("imageType") ImageType imageType,
            @RequestParam("condition") WeatherCondition condition,
            @RequestParam("uploader") String uploader) {
        
        try {
            // Check if transformer exists
            Optional<Transformer> transformer = transformerService.findByTransformerId(transformerId);
            if (transformer.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

            // Validate file
            if (file.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }

            // Upload file to Cloudinary
            String imageUrl = cloudinaryService.uploadImageAndGetSecureUrl(file);

            // Save image metadata to database
            Image savedImage = imageService.uploadImageMetadata(
                transformerId,
                imageUrl,
                imageType,
                condition,
                uploader
            );

            return new ResponseEntity<>(savedImage, HttpStatus.CREATED);

        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Upload image metadata only (when file is already uploaded externally)
     * POST /transformers/{id}/images/metadata
     *
     * @param id The transformer database ID
     * @param imageUploadRequest The image metadata
     * @return Saved image metadata with 201 status
     */
    @PostMapping("/{id}/images/metadata")
    public ResponseEntity<Image> uploadImageMetadata(
            @PathVariable("id") Long id,
            @Valid @RequestBody ImageUploadRequest imageUploadRequest) {
        
        try {
            // Check if transformer exists
            Optional<Transformer> transformer = transformerService.findById(id);
            if (transformer.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

            // Save image metadata to database
            Image savedImage = imageService.uploadImageMetadata(
                transformer.get(),
                imageUploadRequest.getImageUrl(),
                imageUploadRequest.getImageType(),
                imageUploadRequest.getCondition(),
                imageUploadRequest.getUploader()
            );

            return new ResponseEntity<>(savedImage, HttpStatus.CREATED);

        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get all images for a transformer by database ID
     * GET /transformers/{id}/images
     *
     * @param id The transformer database ID
     * @return List of images for the transformer
     */
    @GetMapping("/{id}/images")
    public ResponseEntity<List<Image>> getImagesByTransformerId(@PathVariable("id") Long id) {
        try {
            // Check if transformer exists
            Optional<Transformer> transformer = transformerService.findById(id);
            if (transformer.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

            List<Image> images = imageService.listImagesByTransformer(transformer.get());
            if (images.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            }

            return new ResponseEntity<>(images, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get all images for a transformer by transformer ID
     * GET /transformers/by-transformer-id/{transformerId}/images
     *
     * @param transformerId The unique transformer identifier
     * @return List of images for the transformer
     */
    @GetMapping("/by-transformer-id/{transformerId}/images")
    public ResponseEntity<List<Image>> getImagesByTransformerStringId(@PathVariable("transformerId") String transformerId) {
        try {
            // Check if transformer exists
            if (!transformerService.existsByTransformerId(transformerId)) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

            List<Image> images = imageService.listImagesByTransformerId(transformerId);
            if (images.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            }

            return new ResponseEntity<>(images, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get images by transformer and type
     * GET /transformers/{id}/images?type={imageType}
     *
     * @param id The transformer database ID
     * @param imageType The type of image to filter by
     * @return List of filtered images
     */
    @GetMapping("/{id}/images/by-type")
    public ResponseEntity<List<Image>> getImagesByTransformerAndType(
            @PathVariable("id") Long id,
            @RequestParam("type") ImageType imageType) {
        
        try {
            // Check if transformer exists
            Optional<Transformer> transformer = transformerService.findById(id);
            if (transformer.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

            List<Image> images = imageService.listImagesByTransformerAndType(
                transformer.get().getTransformerId(), 
                imageType
            );
            
            if (images.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            }

            return new ResponseEntity<>(images, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get latest image for a transformer
     * GET /transformers/{id}/images/latest
     *
     * @param id The transformer database ID
     * @return Latest image for the transformer
     */
    @GetMapping("/{id}/images/latest")
    public ResponseEntity<Image> getLatestImage(@PathVariable("id") Long id) {
        try {
            // Check if transformer exists
            Optional<Transformer> transformer = transformerService.findById(id);
            if (transformer.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

            Optional<Image> latestImage = imageService.getLatestImageByTransformerId(
                transformer.get().getTransformerId()
            );
            
            if (latestImage.isPresent()) {
                return new ResponseEntity<>(latestImage.get(), HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            }
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get image count for a transformer
     * GET /transformers/{id}/images/count
     *
     * @param id The transformer database ID
     * @return Number of images for the transformer
     */
    @GetMapping("/{id}/images/count")
    public ResponseEntity<Long> getImageCount(@PathVariable("id") Long id) {
        try {
            // Check if transformer exists
            Optional<Transformer> transformer = transformerService.findById(id);
            if (transformer.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

            long count = imageService.countImagesByTransformerId(
                transformer.get().getTransformerId()
            );
            
            return new ResponseEntity<>(count, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete image by ID
     * DELETE /images/{imageId}
     *
     * @param imageId The image database ID
     * @return 204 if successful, 404 if not found
     */
    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<HttpStatus> deleteImage(@PathVariable("imageId") Long imageId) {
        try {
            Optional<Image> image = imageService.findById(imageId);
            if (image.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

            // Optionally delete from Cloudinary as well
            // cloudinaryService.deleteImage(publicId);

            imageService.deleteImage(imageId);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
