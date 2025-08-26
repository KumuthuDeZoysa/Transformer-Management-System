package com.transformer.management.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.util.Map;

/**
 * Service for handling Cloudinary image upload operations using Java SDK
 */
@Service
public class CloudinaryService {

    @Value("${cloudinary.cloud-name}")
    private String cloudName;

    @Value("${cloudinary.api-key}")
    private String apiKey;

    @Value("${cloudinary.api-secret}")
    private String apiSecret;

    private Cloudinary cloudinary;

    /**
     * Initialize Cloudinary configuration after dependency injection
     */
    @PostConstruct
    private void initCloudinary() {
        cloudinary = new Cloudinary(ObjectUtils.asMap(
            "cloud_name", cloudName,
            "api_key", apiKey,
            "api_secret", apiSecret
        ));
    }

    /**
     * Upload image to Cloudinary and return secure URL
     * @param file The image file to upload
     * @return The secure URL of the uploaded image
     * @throws IOException if upload fails
     */
    public String uploadImageAndGetSecureUrl(MultipartFile file) throws IOException {
        Map<String, Object> uploadResult = uploadImage(file);
        return (String) uploadResult.get("secure_url");
    }

    /**
     * Upload image to Cloudinary with custom folder
     * @param file The image file to upload
     * @param folder The folder to store the image in
     * @return The secure URL of the uploaded image
     * @throws IOException if upload fails
     */
    public String uploadImageToFolderAndGetSecureUrl(MultipartFile file, String folder) throws IOException {
        Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), 
            ObjectUtils.asMap(
                "folder", folder,
                "resource_type", "image",
                "quality", "auto:best",
                "fetch_format", "auto"
            ));
        return (String) uploadResult.get("secure_url");
    }

    /**
     * Upload image to Cloudinary
     * @param file The image file to upload
     * @return Map containing upload result with secure_url, public_id, etc.
     * @throws IOException if upload fails
     */
    public Map<String, Object> uploadImage(MultipartFile file) throws IOException {
        return cloudinary.uploader().upload(file.getBytes(), 
            ObjectUtils.asMap(
                "folder", "transformer-images",
                "resource_type", "image",
                "quality", "auto:best",
                "fetch_format", "auto"
            ));
    }

    /**
     * Upload image with custom options
     * @param file The image file to upload
     * @param folder The folder to store the image in
     * @param publicId Custom public ID for the image
     * @return Map containing upload result
     * @throws IOException if upload fails
     */
    public Map<String, Object> uploadImageWithOptions(MultipartFile file, String folder, String publicId) throws IOException {
        return cloudinary.uploader().upload(file.getBytes(), 
            ObjectUtils.asMap(
                "folder", folder,
                "public_id", publicId,
                "resource_type", "image",
                "quality", "auto:best",
                "fetch_format", "auto",
                "overwrite", true
            ));
    }

    /**
     * Delete image from Cloudinary
     * @param publicId The public ID of the image to delete
     * @return Map containing deletion result
     * @throws IOException if deletion fails
     */
    public Map<String, Object> deleteImage(String publicId) throws IOException {
        return cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
    }

    /**
     * Generate transformation URL for image resizing/optimization
     * @param publicId The public ID of the image
     * @param width Desired width
     * @param height Desired height
     * @return Transformed image URL
     */
    public String generateTransformationUrl(String publicId, int width, int height) {
        return cloudinary.url()
            .transformation(
                ObjectUtils.asMap(
                    "width", width,
                    "height", height,
                    "crop", "fill",
                    "quality", "auto:best",
                    "fetch_format", "auto"
                ))
            .generate(publicId);
    }

    /**
     * Get optimized thumbnail URL
     * @param publicId The public ID of the image
     * @return Thumbnail URL
     */
    public String getThumbnailUrl(String publicId) {
        return generateTransformationUrl(publicId, 300, 200);
    }
}
