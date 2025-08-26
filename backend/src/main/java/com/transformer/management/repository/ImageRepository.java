package com.transformer.management.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.transformer.management.entity.Image;

@Repository
public interface ImageRepository extends JpaRepository<Image, UUID> {
    // Additional query methods can be defined here
}
