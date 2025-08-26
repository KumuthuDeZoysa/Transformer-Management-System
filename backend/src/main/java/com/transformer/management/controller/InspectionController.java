package com.transformer.management.controller;

import com.transformer.management.entity.Inspection;
import com.transformer.management.repository.InspectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/inspections")
public class InspectionController {

    @Autowired
    private InspectionRepository inspectionRepository;

    @GetMapping
    public List<Inspection> getAllInspections() {
        return inspectionRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Inspection> getInspectionById(@PathVariable UUID id) {
        Optional<Inspection> inspection = inspectionRepository.findById(id);
        return inspection.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Inspection createInspection(@RequestBody Inspection inspection) {
        return inspectionRepository.save(inspection);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Inspection> updateInspection(@PathVariable UUID id, @RequestBody Inspection inspectionDetails) {
        Optional<Inspection> inspection = inspectionRepository.findById(id);
        if (inspection.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Inspection existingInspection = inspection.get();
        existingInspection.setInspectionNo(inspectionDetails.getInspectionNo());
        existingInspection.setInspectedAt(inspectionDetails.getInspectedAt());
        existingInspection.setMaintenanceDate(inspectionDetails.getMaintenanceDate());
        existingInspection.setStatus(inspectionDetails.getStatus());
        existingInspection.setNotes(inspectionDetails.getNotes());

        Inspection updatedInspection = inspectionRepository.save(existingInspection);
        return ResponseEntity.ok(updatedInspection);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInspection(@PathVariable UUID id) {
        if (!inspectionRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        inspectionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
