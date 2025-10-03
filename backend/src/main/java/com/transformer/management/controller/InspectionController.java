package com.transformer.management.controller;

import com.transformer.management.entity.Inspection;
import com.transformer.management.entity.Transformer;
import com.transformer.management.repository.InspectionRepository;
import com.transformer.management.repository.TransformerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.Instant;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/inspections")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class InspectionController {

    @Autowired
    private InspectionRepository inspectionRepository;

    @Autowired
    private TransformerRepository transformerRepository;

    // Auto-generate inspection number with format: INSP-YYYYMMDD-NNNN
    private String generateInspectionNumber() {
        String today = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String prefix = "INSP-" + today + "-";
        
        // Find the highest sequence number for today
        List<Inspection> todaysInspections = inspectionRepository.findByInspectionNoStartingWith(prefix);
        
        int nextSequence = 1;
        if (!todaysInspections.isEmpty()) {
            // Extract sequence numbers and find the maximum
            int maxSequence = todaysInspections.stream()
                .mapToInt(inspection -> {
                    String inspectionNo = inspection.getInspectionNo();
                    if (inspectionNo != null && inspectionNo.startsWith(prefix)) {
                        try {
                            return Integer.parseInt(inspectionNo.substring(prefix.length()));
                        } catch (NumberFormatException e) {
                            return 0;
                        }
                    }
                    return 0;
                })
                .max()
                .orElse(0);
            nextSequence = maxSequence + 1;
        }
        
        return prefix + String.format("%04d", nextSequence);
    }

    @GetMapping
    public List<Inspection> getAllInspections() {
        System.out.println("🔍 InspectionController.getAllInspections() called");
        List<Inspection> inspections = inspectionRepository.findAll();
        System.out.println("📊 Found " + inspections.size() + " inspections");
        return inspections;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Inspection> getInspectionById(@PathVariable String id) {
        System.out.println("🔍 Getting inspection with ID: " + id);
        
        Optional<Inspection> inspection;
        
        // Try to parse as UUID first
        try {
            UUID uuid = UUID.fromString(id);
            inspection = inspectionRepository.findById(uuid);
            System.out.println("🔍 Found inspection by UUID: " + inspection.isPresent());
        } catch (IllegalArgumentException e) {
            // If not a valid UUID, inspection IDs are typically UUIDs, so return not found
            System.out.println("❌ Invalid UUID format for inspection ID: " + id);
            return ResponseEntity.notFound().build();
        }
        
        return inspection.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Inspection> createInspection(@RequestBody Map<String, Object> requestData) {
        System.out.println("🔄 Creating new inspection with data: " + requestData);
        
        try {
            // Extract transformer information
            Object transformerObj = requestData.get("transformer");
            String transformerId = null;
            
            if (transformerObj instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> transformerMap = (Map<String, Object>) transformerObj;
                transformerId = (String) transformerMap.get("id");
            } else if (transformerObj instanceof String) {
                transformerId = (String) transformerObj;
            }
            
            if (transformerId == null) {
                return ResponseEntity.badRequest().build();
            }
            
            // Find the transformer
            Optional<Transformer> transformer;
            try {
                UUID uuid = UUID.fromString(transformerId);
                transformer = transformerRepository.findById(uuid);
            } catch (IllegalArgumentException e) {
                transformer = transformerRepository.findByCode(transformerId);
            }
            
            if (transformer.isEmpty()) {
                System.out.println("❌ Transformer not found: " + transformerId);
                return ResponseEntity.badRequest().build();
            }
            
            // Create inspection
            Inspection inspection = new Inspection();
            inspection.setTransformer(transformer.get());
            
            // Auto-generate inspection number if not provided
            String inspectionNo = (String) requestData.get("inspectionNo");
            if (inspectionNo == null || inspectionNo.trim().isEmpty()) {
                inspectionNo = generateInspectionNumber();
            }
            inspection.setInspectionNo(inspectionNo);
            
            // Handle inspectedAt with proper timezone handling
            String inspectedAtStr = (String) requestData.get("inspectedAt");
            if (inspectedAtStr != null) {
                try {
                    // Parse ISO string properly handling timezone
                    Instant instant = Instant.parse(inspectedAtStr);
                    LocalDateTime localDateTime = LocalDateTime.ofInstant(instant, java.time.ZoneId.systemDefault());
                    inspection.setInspectedAt(localDateTime);
                    System.out.println("✅ Parsed inspectedAt: " + inspectedAtStr + " -> " + localDateTime);
                } catch (Exception e) {
                    System.out.println("❌ Failed to parse inspectedAt: " + inspectedAtStr + ", error: " + e.getMessage());
                    // Fallback to current time if parsing fails
                    inspection.setInspectedAt(LocalDateTime.now());
                }
            }
            
            // Handle maintenanceDate with proper timezone handling
            String maintenanceDateStr = (String) requestData.get("maintenanceDate");
            if (maintenanceDateStr != null) {
                try {
                    // Parse ISO string properly handling timezone
                    Instant instant = Instant.parse(maintenanceDateStr);
                    LocalDateTime localDateTime = LocalDateTime.ofInstant(instant, java.time.ZoneId.systemDefault());
                    inspection.setMaintenanceDate(localDateTime);
                    System.out.println("✅ Parsed maintenanceDate: " + maintenanceDateStr + " -> " + localDateTime);
                } catch (Exception e) {
                    System.out.println("❌ Failed to parse maintenanceDate: " + maintenanceDateStr + ", error: " + e.getMessage());
                    // Don't set a fallback for maintenance date as it's optional
                }
            }
            
            inspection.setStatus((String) requestData.get("status"));
            inspection.setNotes((String) requestData.get("notes"));
            
            Inspection savedInspection = inspectionRepository.save(inspection);
            System.out.println("✅ Successfully created inspection: " + savedInspection.getId());
            return ResponseEntity.ok(savedInspection);
            
        } catch (Exception e) {
            System.out.println("❌ Failed to create inspection: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Inspection> updateInspection(@PathVariable String id, @RequestBody Map<String, Object> requestData) {
        System.out.println("🔄 Attempting to update inspection with ID: " + id);
        System.out.println("🔄 Update data received: " + requestData);
        
        Optional<Inspection> inspection;
        
        // Try to parse as UUID first
        try {
            UUID uuid = UUID.fromString(id);
            inspection = inspectionRepository.findById(uuid);
            System.out.println("🔍 Found inspection by UUID: " + inspection.isPresent());
        } catch (IllegalArgumentException e) {
            // If not a valid UUID, inspection IDs are typically UUIDs, so return not found
            System.out.println("❌ Invalid UUID format for inspection ID: " + id);
            return ResponseEntity.notFound().build();
        }
        
        if (inspection.isEmpty()) {
            System.out.println("❌ Inspection not found: " + id);
            return ResponseEntity.notFound().build();
        }

        try {
            Inspection existingInspection = inspection.get();
            
            // Update fields if provided
            if (requestData.containsKey("inspectionNo")) {
                existingInspection.setInspectionNo((String) requestData.get("inspectionNo"));
            }
            
            // Handle inspectedAt
            if (requestData.containsKey("inspectedAt")) {
                String inspectedAtStr = (String) requestData.get("inspectedAt");
                if (inspectedAtStr != null) {
                    existingInspection.setInspectedAt(java.time.LocalDateTime.parse(inspectedAtStr.replace("Z", "")));
                }
            }
            
            // Handle maintenanceDate
            if (requestData.containsKey("maintenanceDate")) {
                String maintenanceDateStr = (String) requestData.get("maintenanceDate");
                if (maintenanceDateStr != null && !maintenanceDateStr.isEmpty()) {
                    existingInspection.setMaintenanceDate(java.time.LocalDateTime.parse(maintenanceDateStr.replace("Z", "")));
                }
            }
            
            if (requestData.containsKey("status")) {
                existingInspection.setStatus((String) requestData.get("status"));
            }
            
            if (requestData.containsKey("notes")) {
                existingInspection.setNotes((String) requestData.get("notes"));
            }

            Inspection updatedInspection = inspectionRepository.save(existingInspection);
            System.out.println("✅ Successfully updated inspection: " + id);
            return ResponseEntity.ok(updatedInspection);
            
        } catch (Exception e) {
            System.out.println("❌ Failed to update inspection: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInspection(@PathVariable String id) {
        System.out.println("🗑️ Attempting to delete inspection with ID: " + id);
        
        // Try to parse as UUID first
        try {
            UUID uuid = UUID.fromString(id);
            if (!inspectionRepository.existsById(uuid)) {
                System.out.println("❌ Inspection not found: " + id);
                return ResponseEntity.notFound().build();
            }
            inspectionRepository.deleteById(uuid);
            System.out.println("✅ Successfully deleted inspection: " + id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            // If not a valid UUID, inspection IDs are typically UUIDs, so return not found
            System.out.println("❌ Invalid UUID format for inspection ID: " + id);
            return ResponseEntity.notFound().build();
        }
    }
}
