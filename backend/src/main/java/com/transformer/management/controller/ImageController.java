package com.transformer.management.controller;

import com.transformer.management.entity.Image;
import com.transformer.management.repository.ImageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/images")
public class ImageController {

    @Autowired
    private ImageRepository imageRepository;

    @GetMapping
    public List<Image> getAllImages() {
        return imageRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Image> getImageById(@PathVariable UUID id) {
        Optional<Image> image = imageRepository.findById(id);
        return image.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Image createImage(@RequestBody Image image) {
        return imageRepository.save(image);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Image> updateImage(@PathVariable UUID id, @RequestBody Image imageDetails) {
        Optional<Image> image = imageRepository.findById(id);
        if (image.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Image existingImage = image.get();
        existingImage.setUrl(imageDetails.getUrl());
        existingImage.setLabel(imageDetails.getLabel());
        existingImage.setCapturedAt(imageDetails.getCapturedAt());

        Image updatedImage = imageRepository.save(existingImage);
        return ResponseEntity.ok(updatedImage);
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
