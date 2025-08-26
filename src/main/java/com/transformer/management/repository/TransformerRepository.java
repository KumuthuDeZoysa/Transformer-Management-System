package com.transformer.management.repository;

import com.transformer.management.entity.Transformer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for Transformer entity
 * Provides CRUD operations and custom query methods
 */
@Repository
public interface TransformerRepository extends JpaRepository<Transformer, Long> {

    /**
     * Find transformer by transformer ID (unique identifier)
     * @param transformerId The unique transformer identifier
     * @return Optional containing the transformer if found
     */
    Optional<Transformer> findByTransformerId(String transformerId);

    /**
     * Check if transformer exists by transformer ID
     * @param transformerId The unique transformer identifier
     * @return true if transformer exists, false otherwise
     */
    boolean existsByTransformerId(String transformerId);

    /**
     * Find transformers by location (case-insensitive)
     * @param location The location to search for
     * @return List of transformers at the specified location
     */
    List<Transformer> findByLocationContainingIgnoreCase(String location);

    /**
     * Find transformers by capacity
     * @param capacity The capacity to search for
     * @return List of transformers with the specified capacity
     */
    List<Transformer> findByCapacity(String capacity);

    /**
     * Find all transformers ordered by creation date (newest first)
     * @return List of transformers ordered by creation date descending
     */
    @Query("SELECT t FROM Transformer t ORDER BY t.createdAt DESC")
    List<Transformer> findAllOrderByCreatedAtDesc();

    /**
     * Find transformers by location and capacity
     * @param location The location to search for
     * @param capacity The capacity to search for
     * @return List of transformers matching both criteria
     */
    List<Transformer> findByLocationContainingIgnoreCaseAndCapacity(String location, String capacity);

    /**
     * Count total number of transformers
     * @return Total count of transformers
     */
    @Query("SELECT COUNT(t) FROM Transformer t")
    long countAllTransformers();

    /**
     * Delete transformer by transformer ID
     * @param transformerId The unique transformer identifier
     */
    void deleteByTransformerId(String transformerId);

    /**
     * Find transformers with images
     * @return List of transformers that have associated images
     */
    @Query("SELECT DISTINCT t FROM Transformer t JOIN t.images i")
    List<Transformer> findTransformersWithImages();

    /**
     * Find transformers without images
     * @return List of transformers that have no associated images
     */
    @Query("SELECT t FROM Transformer t WHERE t.images IS EMPTY")
    List<Transformer> findTransformersWithoutImages();
}
