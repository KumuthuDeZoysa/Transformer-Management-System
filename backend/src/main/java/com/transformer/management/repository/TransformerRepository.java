package com.transformer.management.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.transformer.management.entity.Transformer;

@Repository
public interface TransformerRepository extends JpaRepository<Transformer, UUID> {
    // Find transformer by code field
    Optional<Transformer> findByCode(String code);
}
