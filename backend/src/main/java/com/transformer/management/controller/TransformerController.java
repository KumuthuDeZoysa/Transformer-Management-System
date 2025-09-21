package com.transformer.management.controller;

import com.transformer.management.entity.Transformer;
import com.transformer.management.repository.TransformerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/transformers")
public class TransformerController {

    @Autowired
    private TransformerRepository transformerRepository;

    @GetMapping
    public List<Transformer> getAllTransformers() {
        System.out.println("🔍 TransformerController.getAllTransformers() called");
        List<Transformer> transformers = transformerRepository.findAll();
        System.out.println("📊 Found " + transformers.size() + " transformers");
        return transformers;
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Transformer API is working!");
    }

    @GetMapping("/{id}")
    public ResponseEntity<Transformer> getTransformerById(@PathVariable String id) {
        System.out.println("🔍 Getting transformer with ID: " + id);
        
        Optional<Transformer> transformer;
        
        // Try to parse as UUID first
        try {
            UUID uuid = UUID.fromString(id);
            transformer = transformerRepository.findById(uuid);
            System.out.println("🔍 Found transformer by UUID: " + transformer.isPresent());
        } catch (IllegalArgumentException e) {
            // If not a valid UUID, try to find by code
            transformer = transformerRepository.findByCode(id);
            System.out.println("🔍 Found transformer by code: " + transformer.isPresent());
        }
        
        return transformer.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Transformer createTransformer(@RequestBody Transformer transformer) {
        return transformerRepository.save(transformer);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Transformer> updateTransformer(@PathVariable String id, @RequestBody Transformer transformerDetails) {
        System.out.println("🔄 Attempting to update transformer with ID: " + id);
        
        Optional<Transformer> transformer;
        
        // Try to parse as UUID first
        try {
            UUID uuid = UUID.fromString(id);
            transformer = transformerRepository.findById(uuid);
            System.out.println("🔍 Found transformer by UUID: " + transformer.isPresent());
        } catch (IllegalArgumentException e) {
            // If not a valid UUID, try to find by code
            transformer = transformerRepository.findByCode(id);
            System.out.println("🔍 Found transformer by code: " + transformer.isPresent());
        }
        
        if (transformer.isEmpty()) {
            System.out.println("❌ Transformer not found: " + id);
            return ResponseEntity.notFound().build();
        }

        Transformer existingTransformer = transformer.get();
        existingTransformer.setCode(transformerDetails.getCode());
        existingTransformer.setPoleNo(transformerDetails.getPoleNo());
        existingTransformer.setRegion(transformerDetails.getRegion());
        existingTransformer.setType(transformerDetails.getType());
        existingTransformer.setCapacity(transformerDetails.getCapacity());
        existingTransformer.setLocation(transformerDetails.getLocation());
        existingTransformer.setStatus(transformerDetails.getStatus());
        existingTransformer.setLastInspection(transformerDetails.getLastInspection());

        Transformer updatedTransformer = transformerRepository.save(existingTransformer);
        System.out.println("✅ Successfully updated transformer: " + id);
        return ResponseEntity.ok(updatedTransformer);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransformer(@PathVariable String id) {
        System.out.println("🗑️ Attempting to delete transformer with ID: " + id);
        
        Optional<Transformer> transformer;
        
        // Try to parse as UUID first
        try {
            UUID uuid = UUID.fromString(id);
            transformer = transformerRepository.findById(uuid);
            System.out.println("🔍 Found transformer by UUID: " + transformer.isPresent());
        } catch (IllegalArgumentException e) {
            // If not a valid UUID, try to find by code
            transformer = transformerRepository.findByCode(id);
            System.out.println("🔍 Found transformer by code: " + transformer.isPresent());
        }
        
        if (transformer.isPresent()) {
            transformerRepository.delete(transformer.get());
            System.out.println("✅ Successfully deleted transformer: " + id);
            return ResponseEntity.noContent().build();
        } else {
            System.out.println("❌ Transformer not found: " + id);
            return ResponseEntity.notFound().build();
        }
    }
}
