package com.transformer.management.controller;

import com.transformer.management.entity.MaintenanceRecord;
import com.transformer.management.entity.Inspection;
import com.transformer.management.entity.Transformer;
import com.transformer.management.repository.MaintenanceRecordRepository;
import com.transformer.management.repository.InspectionRepository;
import com.transformer.management.repository.TransformerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/maintenance-records")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class MaintenanceRecordController {

    @Autowired
    private MaintenanceRecordRepository maintenanceRecordRepository;

    @Autowired
    private InspectionRepository inspectionRepository;

    @Autowired
    private TransformerRepository transformerRepository;

    @GetMapping
    public List<MaintenanceRecord> getAllMaintenanceRecords() {
        System.out.println("🔍 MaintenanceRecordController.getAllMaintenanceRecords() called");
        List<MaintenanceRecord> records = maintenanceRecordRepository.findAll();
        System.out.println("📊 Found " + records.size() + " maintenance records");
        return records;
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaintenanceRecord> getMaintenanceRecordById(@PathVariable String id) {
        System.out.println("🔍 Getting maintenance record with ID: " + id);
        
        try {
            UUID uuid = UUID.fromString(id);
            Optional<MaintenanceRecord> record = maintenanceRecordRepository.findById(uuid);
            
            return record.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            System.out.println("❌ Invalid UUID format for maintenance record ID: " + id);
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/inspection/{inspectionId}")
    public ResponseEntity<MaintenanceRecord> getMaintenanceRecordByInspectionId(@PathVariable String inspectionId) {
        System.out.println("🔍 Getting maintenance record for inspection ID: " + inspectionId);
        
        try {
            UUID uuid = UUID.fromString(inspectionId);
            List<MaintenanceRecord> records = maintenanceRecordRepository.findByInspectionId(uuid);
            
            if (records.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            // Return the most recent record for this inspection
            MaintenanceRecord latestRecord = records.stream()
                    .max((r1, r2) -> r1.getCreatedAt().compareTo(r2.getCreatedAt()))
                    .orElse(null);
            
            return ResponseEntity.ok(latestRecord);
        } catch (IllegalArgumentException e) {
            System.out.println("❌ Invalid UUID format for inspection ID: " + inspectionId);
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/transformer/{transformerId}")
    public List<MaintenanceRecord> getMaintenanceRecordsByTransformerId(@PathVariable String transformerId) {
        System.out.println("🔍 Getting maintenance records for transformer ID: " + transformerId);
        
        try {
            UUID uuid = UUID.fromString(transformerId);
            return maintenanceRecordRepository.findByTransformerId(uuid);
        } catch (IllegalArgumentException e) {
            System.out.println("❌ Invalid UUID format for transformer ID: " + transformerId);
            return List.of();
        }
    }

    /**
     * Create a new maintenance record.
     * Only ENGINEER and ADMIN roles can create maintenance records.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ENGINEER', 'ADMIN')")
    public ResponseEntity<MaintenanceRecord> createMaintenanceRecord(@RequestBody Map<String, Object> requestData) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("🔄 Creating new maintenance record. User: " + auth.getName() + ", Data: " + requestData);
        
        try {
            // Extract and validate inspection ID
            String inspectionIdStr = (String) requestData.get("inspectionId");
            if (inspectionIdStr == null) {
                System.out.println("❌ Missing inspectionId");
                return ResponseEntity.badRequest().build();
            }
            
            UUID inspectionId = UUID.fromString(inspectionIdStr);
            Optional<Inspection> inspection = inspectionRepository.findById(inspectionId);
            
            if (inspection.isEmpty()) {
                System.out.println("❌ Inspection not found: " + inspectionIdStr);
                return ResponseEntity.badRequest().build();
            }
            
            // Extract transformer ID from inspection
            Transformer transformer = inspection.get().getTransformer();
            if (transformer == null) {
                System.out.println("❌ Transformer not found for inspection: " + inspectionIdStr);
                return ResponseEntity.badRequest().build();
            }
            
            // Create maintenance record
            MaintenanceRecord record = new MaintenanceRecord();
            record.setInspection(inspection.get());
            record.setTransformer(transformer);
            
            // Set all fields from request
            if (requestData.containsKey("inspectorName")) {
                record.setInspectorName((String) requestData.get("inspectorName"));
            }
            if (requestData.containsKey("transformerStatus")) {
                record.setTransformerStatus((String) requestData.get("transformerStatus"));
            }
            if (requestData.containsKey("voltageReading")) {
                record.setVoltageReading((String) requestData.get("voltageReading"));
            }
            if (requestData.containsKey("currentReading")) {
                record.setCurrentReading((String) requestData.get("currentReading"));
            }
            if (requestData.containsKey("powerFactor")) {
                record.setPowerFactor((String) requestData.get("powerFactor"));
            }
            if (requestData.containsKey("temperature")) {
                record.setTemperature((String) requestData.get("temperature"));
            }
            if (requestData.containsKey("recommendedAction")) {
                record.setRecommendedAction((String) requestData.get("recommendedAction"));
            }
            if (requestData.containsKey("additionalRemarks")) {
                record.setAdditionalRemarks((String) requestData.get("additionalRemarks"));
            }
            
            // Handle completion date
            if (requestData.containsKey("completionDate")) {
                String completionDateStr = (String) requestData.get("completionDate");
                if (completionDateStr != null && !completionDateStr.isEmpty()) {
                    try {
                        Instant instant = Instant.parse(completionDateStr);
                        LocalDateTime localDateTime = LocalDateTime.ofInstant(instant, java.time.ZoneId.systemDefault());
                        record.setCompletionDate(localDateTime);
                    } catch (Exception e) {
                        System.out.println("⚠️ Failed to parse completionDate: " + completionDateStr);
                    }
                }
            }
            
            MaintenanceRecord savedRecord = maintenanceRecordRepository.save(record);
            System.out.println("✅ Successfully created maintenance record: " + savedRecord.getId());
            return ResponseEntity.ok(savedRecord);
            
        } catch (Exception e) {
            System.out.println("❌ Failed to create maintenance record: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Update an existing maintenance record.
     * Only ENGINEER and ADMIN roles can update maintenance records.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ENGINEER', 'ADMIN')")
    public ResponseEntity<MaintenanceRecord> updateMaintenanceRecord(@PathVariable String id, @RequestBody Map<String, Object> requestData) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("🔄 Updating maintenance record " + id + ". User: " + auth.getName());
        
        try {
            UUID uuid = UUID.fromString(id);
            Optional<MaintenanceRecord> optionalRecord = maintenanceRecordRepository.findById(uuid);
            
            if (optionalRecord.isEmpty()) {
                System.out.println("❌ Maintenance record not found: " + id);
                return ResponseEntity.notFound().build();
            }
            
            MaintenanceRecord record = optionalRecord.get();
            
            // Update fields if provided
            if (requestData.containsKey("inspectorName")) {
                record.setInspectorName((String) requestData.get("inspectorName"));
            }
            if (requestData.containsKey("transformerStatus")) {
                record.setTransformerStatus((String) requestData.get("transformerStatus"));
            }
            if (requestData.containsKey("voltageReading")) {
                record.setVoltageReading((String) requestData.get("voltageReading"));
            }
            if (requestData.containsKey("currentReading")) {
                record.setCurrentReading((String) requestData.get("currentReading"));
            }
            if (requestData.containsKey("powerFactor")) {
                record.setPowerFactor((String) requestData.get("powerFactor"));
            }
            if (requestData.containsKey("temperature")) {
                record.setTemperature((String) requestData.get("temperature"));
            }
            if (requestData.containsKey("recommendedAction")) {
                record.setRecommendedAction((String) requestData.get("recommendedAction"));
            }
            if (requestData.containsKey("additionalRemarks")) {
                record.setAdditionalRemarks((String) requestData.get("additionalRemarks"));
            }
            
            // Handle completion date
            if (requestData.containsKey("completionDate")) {
                String completionDateStr = (String) requestData.get("completionDate");
                if (completionDateStr != null && !completionDateStr.isEmpty()) {
                    try {
                        Instant instant = Instant.parse(completionDateStr);
                        LocalDateTime localDateTime = LocalDateTime.ofInstant(instant, java.time.ZoneId.systemDefault());
                        record.setCompletionDate(localDateTime);
                    } catch (Exception e) {
                        System.out.println("⚠️ Failed to parse completionDate: " + completionDateStr);
                    }
                }
            }
            
            MaintenanceRecord updatedRecord = maintenanceRecordRepository.save(record);
            System.out.println("✅ Successfully updated maintenance record: " + id);
            return ResponseEntity.ok(updatedRecord);
            
        } catch (IllegalArgumentException e) {
            System.out.println("❌ Invalid UUID format: " + id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.out.println("❌ Failed to update maintenance record: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Delete a maintenance record.
     * Only ADMIN role can delete maintenance records.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteMaintenanceRecord(@PathVariable String id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("🗑️ Deleting maintenance record " + id + ". User: " + auth.getName());
        
        try {
            UUID uuid = UUID.fromString(id);
            
            if (!maintenanceRecordRepository.existsById(uuid)) {
                System.out.println("❌ Maintenance record not found: " + id);
                return ResponseEntity.notFound().build();
            }
            
            maintenanceRecordRepository.deleteById(uuid);
            System.out.println("✅ Successfully deleted maintenance record: " + id);
            return ResponseEntity.noContent().build();
            
        } catch (IllegalArgumentException e) {
            System.out.println("❌ Invalid UUID format: " + id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.out.println("❌ Error deleting maintenance record: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
