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
@RequestMapping("/api/transformers")
public class TransformerController {

    @Autowired
    private TransformerRepository transformerRepository;

    @GetMapping
    public List<Transformer> getAllTransformers() {
        return transformerRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Transformer> getTransformerById(@PathVariable UUID id) {
        Optional<Transformer> transformer = transformerRepository.findById(id);
        return transformer.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Transformer createTransformer(@RequestBody Transformer transformer) {
        return transformerRepository.save(transformer);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Transformer> updateTransformer(@PathVariable UUID id, @RequestBody Transformer transformerDetails) {
        Optional<Transformer> transformer = transformerRepository.findById(id);
        if (transformer.isEmpty()) {
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
        return ResponseEntity.ok(updatedTransformer);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransformer(@PathVariable UUID id) {
        if (!transformerRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        transformerRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
