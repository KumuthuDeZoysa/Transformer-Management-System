package com.transformer.management.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.transformer.management.entity.Inspection;

@Repository
public interface InspectionRepository extends JpaRepository<Inspection, UUID> {
    // Additional query methods can be defined here
}
