package com.transformer.management.controller;

import com.transformer.management.entity.Image;
import com.transformer.management.entity.Transformer;
import com.transformer.management.entity.Inspection;
import com.transformer.management.dto.ImageDTO;
import com.transformer.management.repository.ImageRepository;
import com.transformer.management.repository.TransformerRepository;
import com.transformer.management.repository.InspectionRepository;
import com.transformer.management.service.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/images")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class ImageController {

    @Autowired
    private ImageRepository imageRepository;

    @Autowired
    private TransformerRepository transformerRepository;

    @Autowired
    private InspectionRepository inspectionRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    @GetMapping
    public List<ImageDTO> getAllImages(@RequestParam(required = false) String transformerId,
                                      @RequestParam(required = false) String imageType,
                                      @RequestParam(required = false) String inspectionId) {
        System.out.println("🔍 ImageController.getAllImages() called with transformerId: " + transformerId + 
                          ", imageType: " + imageType + ", inspectionId: " + inspectionId);
        
        List<Image> images = List.of();
        
        if (transformerId != null && imageType != null) {
            try {
                UUID uuid = UUID.fromString(transformerId);
                images = imageRepository.findByTransformerIdAndImageType(uuid, imageType);
                System.out.println("📊 Found " + images.size() + " images for transformer " + transformerId + " with type " + imageType);
            } catch (IllegalArgumentException e) {
                System.out.println("❌ Invalid transformer UUID: " + transformerId);
                return List.of();
            }
        } else if (transformerId != null) {
            try {
                UUID uuid = UUID.fromString(transformerId);
                images = imageRepository.findByTransformerId(uuid);
                System.out.println("📊 Found " + images.size() + " images for transformer " + transformerId);
            } catch (IllegalArgumentException e) {
                System.out.println("❌ Invalid transformer UUID: " + transformerId);
                return List.of();
            }
        } else if (inspectionId != null) {
            try {
                UUID uuid = UUID.fromString(inspectionId);
                images = imageRepository.findByInspectionId(uuid);
                System.out.println("📊 Found " + images.size() + " images for inspection " + inspectionId);
            } catch (IllegalArgumentException e) {
                System.out.println("❌ Invalid inspection UUID: " + inspectionId);
                return List.of();
            }
        } else if (imageType != null) {
            images = imageRepository.findByImageType(imageType);
            System.out.println("📊 Found " + images.size() + " images with type " + imageType);
        } else {
            images = imageRepository.findAll();
            System.out.println("📊 Found " + images.size() + " total images");
        }
        
        return images.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    private ImageDTO convertToDTO(Image image) {
        ImageDTO dto = new ImageDTO();
        dto.setId(image.getId());
        dto.setUrl(image.getUrl());
        dto.setLabel(image.getLabel());
        dto.setImageType(image.getImageType());
        dto.setUploaderName(image.getUploaderName());
        dto.setEnvironmentalCondition(image.getEnvironmentalCondition());
        dto.setComments(image.getComments());
        dto.setCapturedAt(image.getCapturedAt());
        dto.setCreatedAt(image.getCreatedAt());
        
        if (image.getTransformer() != null) {
            dto.setTransformerId(image.getTransformer().getId());
            dto.setTransformerCode(image.getTransformer().getCode());
        }
        
        if (image.getInspection() != null) {
            dto.setInspectionId(image.getInspection().getId());
            dto.setInspectionNo(image.getInspection().getInspectionNo());
        }
        
        return dto;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ImageDTO> getImageById(@PathVariable UUID id) {
        Optional<Image> image = imageRepository.findById(id);
        return image.map(img -> ResponseEntity.ok(convertToDTO(img)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/baseline/{transformerId}")
    public ResponseEntity<ImageDTO> getBaselineImage(@PathVariable String transformerId) {
        System.out.println("🔍 Getting baseline image for transformer: " + transformerId);
        
        try {
            UUID uuid = UUID.fromString(transformerId);
            // Use the new sorted method to get the most recent baseline image
            List<Image> baselineImages = imageRepository.findByTransformerIdAndImageTypeOrderByCapturedAtDesc(uuid, "baseline");
            
            if (!baselineImages.isEmpty()) {
                System.out.println("✅ Found most recent baseline image: " + baselineImages.get(0).getId() + " captured at: " + baselineImages.get(0).getCapturedAt());
                return ResponseEntity.ok(convertToDTO(baselineImages.get(0)));
            } else {
                System.out.println("📭 No baseline image found for transformer: " + transformerId);
                return ResponseEntity.notFound().build();
            }
        } catch (IllegalArgumentException e) {
            System.out.println("❌ Invalid transformer UUID: " + transformerId);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/inspection/{inspectionId}/baseline")
    public ResponseEntity<ImageDTO> getBaselineImageByInspection(@PathVariable String inspectionId) {
        System.out.println("🔍 Getting baseline image for inspection: " + inspectionId);
        
        try {
            UUID uuid = UUID.fromString(inspectionId);
            List<Image> baselineImages = imageRepository.findByInspectionIdAndImageType(uuid, "baseline");
            
            if (!baselineImages.isEmpty()) {
                System.out.println("✅ Found baseline image for inspection: " + baselineImages.get(0).getId());
                return ResponseEntity.ok(convertToDTO(baselineImages.get(0)));
            } else {
                System.out.println("📭 No baseline image found for inspection: " + inspectionId);
                return ResponseEntity.notFound().build();
            }
        } catch (IllegalArgumentException e) {
            System.out.println("❌ Invalid inspection UUID: " + inspectionId);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Image> createImage(@RequestBody Map<String, Object> requestData) {
        System.out.println("🔄 Creating new image with data: " + requestData);
        
        try {
            // Extract transformer information
            String transformerId = (String) requestData.get("transformer_id");
            if (transformerId == null) {
                return ResponseEntity.badRequest().build();
            }
            
            // Find the transformer
            Optional<Transformer> transformer;
            try {
                UUID uuid = UUID.fromString(transformerId);
                transformer = transformerRepository.findById(uuid);
            } catch (IllegalArgumentException e) {
                transformer = transformerRepository.findByCode(transformerId);
            }
            
            if (transformer.isEmpty()) {
                System.out.println("❌ Transformer not found: " + transformerId);
                return ResponseEntity.badRequest().build();
            }
            
            // Create image
            Image image = new Image();
            image.setTransformer(transformer.get());
            image.setUrl((String) requestData.get("url"));
            image.setLabel((String) requestData.get("label"));
            
            // Handle capturedAt
            String capturedAtStr = (String) requestData.get("captured_at");
            if (capturedAtStr != null) {
                image.setCapturedAt(java.time.LocalDateTime.parse(capturedAtStr.replace("Z", "")));
            }
            
            Image savedImage = imageRepository.save(image);
            System.out.println("✅ Successfully created image: " + savedImage.getId());
            return ResponseEntity.ok(savedImage);
            
        } catch (Exception e) {
            System.out.println("❌ Failed to create image: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("transformer_id") String transformerId,
            @RequestParam(value = "label", required = false) String label,
            @RequestParam("image_type") String imageType,
            @RequestParam("uploader_name") String uploaderName,
            @RequestParam(value = "environmental_condition", required = false) String environmentalCondition,
            @RequestParam(value = "comments", required = false) String comments,
            @RequestParam(value = "inspection_id", required = false) String inspectionId) {
        
        System.out.println("🔄 Uploading image file: " + file.getOriginalFilename() + " for transformer: " + transformerId);
        System.out.println("📝 Upload parameters: imageType=" + imageType + ", uploaderName=" + uploaderName + 
                          ", environmentalCondition=" + environmentalCondition + ", inspectionId=" + inspectionId);
        
        try {
            // Validate required parameters
            if (file == null || file.isEmpty()) {
                System.out.println("❌ No file provided or file is empty");
                return ResponseEntity.badRequest().body(Map.of("error", "No file provided or file is empty"));
            }
            
            if (transformerId == null || transformerId.trim().isEmpty()) {
                System.out.println("❌ Transformer ID is required");
                return ResponseEntity.badRequest().body(Map.of("error", "Transformer ID is required"));
            }
            
            if (imageType == null || imageType.trim().isEmpty()) {
                System.out.println("❌ Image type is required");
                return ResponseEntity.badRequest().body(Map.of("error", "Image type is required"));
            }
            
            if (uploaderName == null || uploaderName.trim().isEmpty()) {
                System.out.println("❌ Uploader name is required");
                return ResponseEntity.badRequest().body(Map.of("error", "Uploader name is required"));
            }

            // Find the transformer
            Optional<Transformer> transformer;
            try {
                UUID uuid = UUID.fromString(transformerId);
                transformer = transformerRepository.findById(uuid);
                System.out.println("🔍 Looking for transformer with UUID: " + uuid);
            } catch (IllegalArgumentException e) {
                System.out.println("⚠️ Invalid UUID format, trying code lookup: " + transformerId);
                transformer = transformerRepository.findByCode(transformerId);
            }
            
            if (transformer.isEmpty()) {
                System.out.println("❌ Transformer not found: " + transformerId);
                return ResponseEntity.badRequest().body(Map.of("error", "Transformer not found: " + transformerId));
            }
            
            System.out.println("✅ Found transformer: " + transformer.get().getCode() + " (ID: " + transformer.get().getId() + ")");

            // Find inspection if provided
            Optional<Inspection> inspection = Optional.empty();
            if (inspectionId != null && !inspectionId.trim().isEmpty()) {
                try {
                    UUID inspectionUuid = UUID.fromString(inspectionId);
                    inspection = inspectionRepository.findById(inspectionUuid);
                    if (inspection.isPresent()) {
                        System.out.println("✅ Found inspection: " + inspection.get().getInspectionNo() + " (ID: " + inspectionUuid + ")");
                    } else {
                        System.out.println("⚠️ Inspection not found with ID: " + inspectionUuid);
                        return ResponseEntity.badRequest().body(Map.of("error", "Inspection not found with ID: " + inspectionId));
                    }
                } catch (IllegalArgumentException e) {
                    System.out.println("❌ Invalid inspection UUID format: " + inspectionId);
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid inspection ID format: " + inspectionId));
                }
            }

            // Upload to Cloudinary
            System.out.println("☁️ Uploading image to Cloudinary...");
            String folder = "transformer-images/" + imageType.toLowerCase();
            String[] tags = {imageType, "transformer-" + transformer.get().getCode()};
            
            Map<String, Object> uploadResult = cloudinaryService.uploadFile(file, folder, tags);
            String cloudinaryUrl = (String) uploadResult.get("secure_url");
            
            if (cloudinaryUrl == null || cloudinaryUrl.isEmpty()) {
                System.out.println("❌ Failed to get Cloudinary URL from upload result");
                return ResponseEntity.status(500).body(Map.of("error", "Failed to upload image to Cloudinary"));
            }
            
            System.out.println("✅ Image uploaded to Cloudinary: " + cloudinaryUrl);

            // Create image record with all metadata
            Image image = new Image();
            image.setTransformer(transformer.get());
            image.setUrl(cloudinaryUrl);
            image.setLabel(label != null ? label : file.getOriginalFilename());
            image.setImageType(imageType);
            image.setUploaderName(uploaderName);
            image.setEnvironmentalCondition(environmentalCondition);
            image.setComments(comments);
            if (inspection.isPresent()) {
                image.setInspection(inspection.get());
            }

            System.out.println("💾 Saving image to database...");
            Image savedImage = imageRepository.save(image);
            System.out.println("✅ Successfully uploaded and saved image: " + savedImage.getId() + 
                             " [Type: " + imageType + ", Uploader: " + uploaderName + "]");

            return ResponseEntity.ok(Map.of(
                "url", cloudinaryUrl,
                "image", convertToDTO(savedImage),
                "message", "Image uploaded successfully"
            ));
            
        } catch (Exception e) {
            System.out.println("❌ Failed to upload image: " + e.getMessage());
            System.out.println("❌ Full stack trace:");
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ImageDTO> updateImage(@PathVariable UUID id, @RequestBody Map<String, Object> requestData) {
        System.out.println("🔄 Updating image with ID: " + id);
        
        Optional<Image> image = imageRepository.findById(id);
        if (image.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {
            Image existingImage = image.get();
            
            if (requestData.containsKey("url")) {
                existingImage.setUrl((String) requestData.get("url"));
            }
            
            if (requestData.containsKey("label")) {
                existingImage.setLabel((String) requestData.get("label"));
            }
            
            if (requestData.containsKey("captured_at")) {
                String capturedAtStr = (String) requestData.get("captured_at");
                if (capturedAtStr != null) {
                    existingImage.setCapturedAt(java.time.LocalDateTime.parse(capturedAtStr.replace("Z", "")));
                }
            }

            Image updatedImage = imageRepository.save(existingImage);
            System.out.println("✅ Successfully updated image: " + id);
            return ResponseEntity.ok(convertToDTO(updatedImage));
            
        } catch (Exception e) {
            System.out.println("❌ Failed to update image: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteImage(@PathVariable UUID id) {
        if (!imageRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        imageRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
