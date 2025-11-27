package com.transformer.management.repository;

import java.util.UUID;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.transformer.management.entity.Inspection;

@Repository
public interface InspectionRepository extends JpaRepository<Inspection, UUID> {
    // Find inspections by inspection number starting with prefix (for auto-generation)
    List<Inspection> findByInspectionNoStartingWith(String prefix);
    
    // Find all inspections ordered by inspected date descending (most recent first)
    List<Inspection> findAllByOrderByInspectedAtDesc();
}
