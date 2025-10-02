package com.transformer.management.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;

    /**
     * Upload file to Cloudinary
     * @param file The file to upload
     * @param folder The folder in Cloudinary to store the file (e.g., "transformers", "inspections/{inspectionId}")
     * @param tags Tags to apply to the image for easier searching
     * @return Map containing upload result with secure_url, public_id, etc.
     * @throws IOException if upload fails
     */
    public Map<String, Object> uploadFile(MultipartFile file, String folder, String... tags) throws IOException {
        System.out.println("☁️ Uploading file to Cloudinary: " + file.getOriginalFilename());
        System.out.println("📁 Folder: " + folder + ", Tags: " + String.join(", ", tags));
        
        Map<String, Object> uploadParams = ObjectUtils.asMap(
            "folder", folder,
            "resource_type", "auto"
        );
        
        if (tags != null && tags.length > 0) {
            uploadParams.put("tags", tags);
        }
        
        try {
            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);
            System.out.println("✅ Successfully uploaded to Cloudinary: " + uploadResult.get("secure_url"));
            return uploadResult;
        } catch (IOException e) {
            System.out.println("❌ Failed to upload to Cloudinary: " + e.getMessage());
            throw e;
        }
    }

    /**
     * Delete file from Cloudinary
     * @param publicId The public ID of the image to delete
     * @return Map containing deletion result
     * @throws IOException if deletion fails
     */
    public Map<String, Object> deleteFile(String publicId) throws IOException {
        System.out.println("🗑️ Deleting file from Cloudinary: " + publicId);
        
        try {
            Map<String, Object> result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            System.out.println("✅ Successfully deleted from Cloudinary: " + publicId);
            return result;
        } catch (IOException e) {
            System.out.println("❌ Failed to delete from Cloudinary: " + e.getMessage());
            throw e;
        }
    }

    /**
     * Extract public ID from Cloudinary URL
     * @param url The Cloudinary URL
     * @return The public ID
     */
    public String extractPublicId(String url) {
        if (url == null || !url.contains("cloudinary.com")) {
            return null;
        }
        
        try {
            // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
            String[] parts = url.split("/upload/");
            if (parts.length > 1) {
                String pathWithVersion = parts[1];
                // Remove version if present (starts with v followed by numbers)
                String path = pathWithVersion.replaceFirst("^v\\d+/", "");
                // Remove file extension
                int lastDot = path.lastIndexOf('.');
                if (lastDot > 0) {
                    path = path.substring(0, lastDot);
                }
                return path;
            }
        } catch (Exception e) {
            System.out.println("⚠️ Failed to extract public ID from URL: " + url);
        }
        
        return null;
    }
}
