package com.transformer.management.service;

import com.transformer.management.entity.Transformer;
import com.transformer.management.repository.TransformerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service class for Transformer operations
 * Provides methods to add, update, delete, and list transformers
 */
@Service
@RequiredArgsConstructor
@Transactional
public class TransformerService {

    private final TransformerRepository transformerRepository;

    /**
     * Add a new transformer to the system
     * @param transformer The transformer to add
     * @return The saved transformer with generated ID
     * @throws IllegalArgumentException if transformer with same transformerId already exists
     */
    public Transformer addTransformer(Transformer transformer) {
        // Check if transformer with same transformerId already exists
        if (transformer.getTransformerId() != null && 
            transformerRepository.existsByTransformerId(transformer.getTransformerId())) {
            throw new IllegalArgumentException("Transformer with ID " + transformer.getTransformerId() + " already exists");
        }
        return transformerRepository.save(transformer);
    }

    /**
     * Find transformer by ID
     * @param id The transformer database ID
     * @return Optional containing the transformer if found
     */
    @Transactional(readOnly = true)
    public Optional<Transformer> findById(Long id) {
        return transformerRepository.findById(id);
    }

    /**
     * Find transformer by transformer ID
     * @param transformerId The unique transformer identifier
     * @return Optional containing the transformer if found
     */
    @Transactional(readOnly = true)
    public Optional<Transformer> findByTransformerId(String transformerId) {
        return transformerRepository.findByTransformerId(transformerId);
    }

    /**
     * List all transformers in the system
     * @return List of all transformers ordered by creation date (newest first)
     */
    @Transactional(readOnly = true)
    public List<Transformer> listAllTransformers() {
        return transformerRepository.findAllOrderByCreatedAtDesc();
    }

    /**
     * List transformers with pagination support
     * @return List of all transformers (for basic listing)
     */
    @Transactional(readOnly = true)
    public List<Transformer> listTransformers() {
        return transformerRepository.findAll();
    }

    /**
     * Search transformers by location
     * @param location The location to search for
     * @return List of transformers at the specified location
     */
    @Transactional(readOnly = true)
    public List<Transformer> searchByLocation(String location) {
        return transformerRepository.findByLocationContainingIgnoreCase(location);
    }

    /**
     * Update an existing transformer
     * @param transformer The transformer to update (must have valid ID)
     * @return The updated transformer
     * @throws IllegalArgumentException if transformer doesn't exist
     */
    public Transformer updateTransformer(Transformer transformer) {
        if (transformer.getId() == null) {
            throw new IllegalArgumentException("Transformer ID cannot be null for update operation");
        }
        
        // Verify transformer exists
        if (!transformerRepository.existsById(transformer.getId())) {
            throw new IllegalArgumentException("Transformer with ID " + transformer.getId() + " does not exist");
        }
        
        return transformerRepository.save(transformer);
    }

    /**
     * Update transformer by transformer ID
     * @param transformerId The unique transformer identifier
     * @param updatedData The transformer data to update
     * @return The updated transformer
     * @throws IllegalArgumentException if transformer doesn't exist
     */
    public Transformer updateTransformerByTransformerId(String transformerId, Transformer updatedData) {
        Optional<Transformer> existingTransformer = transformerRepository.findByTransformerId(transformerId);
        if (existingTransformer.isEmpty()) {
            throw new IllegalArgumentException("Transformer with ID " + transformerId + " does not exist");
        }
        
        Transformer transformer = existingTransformer.get();
        // Update fields while preserving ID and createdAt
        transformer.setTransformerId(updatedData.getTransformerId());
        transformer.setLocation(updatedData.getLocation());
        transformer.setCapacity(updatedData.getCapacity());
        
        return transformerRepository.save(transformer);
    }

    /**
     * Delete transformer by database ID
     * @param id The transformer database ID
     * @throws IllegalArgumentException if transformer doesn't exist
     */
    public void deleteTransformer(Long id) {
        if (!transformerRepository.existsById(id)) {
            throw new IllegalArgumentException("Transformer with ID " + id + " does not exist");
        }
        transformerRepository.deleteById(id);
    }

    /**
     * Delete transformer by transformer ID
     * @param transformerId The unique transformer identifier
     * @throws IllegalArgumentException if transformer doesn't exist
     */
    public void deleteTransformerByTransformerId(String transformerId) {
        if (!transformerRepository.existsByTransformerId(transformerId)) {
            throw new IllegalArgumentException("Transformer with ID " + transformerId + " does not exist");
        }
        transformerRepository.deleteByTransformerId(transformerId);
    }

    /**
     * Check if transformer exists by transformer ID
     * @param transformerId The unique transformer identifier
     * @return true if transformer exists, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean existsByTransformerId(String transformerId) {
        return transformerRepository.existsByTransformerId(transformerId);
    }

    /**
     * Get total count of transformers
     * @return Total number of transformers
     */
    @Transactional(readOnly = true)
    public long getTotalCount() {
        return transformerRepository.countAllTransformers();
    }

    /**
     * Get transformers with images
     * @return List of transformers that have associated images
     */
    @Transactional(readOnly = true)
    public List<Transformer> getTransformersWithImages() {
        return transformerRepository.findTransformersWithImages();
    }

    /**
     * Get transformers without images
     * @return List of transformers that have no associated images
     */
    @Transactional(readOnly = true)
    public List<Transformer> getTransformersWithoutImages() {
        return transformerRepository.findTransformersWithoutImages();
    }
}
