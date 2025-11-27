package com.transformer.management.repository;

import com.transformer.management.entity.MaintenanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MaintenanceRecordRepository extends JpaRepository<MaintenanceRecord, UUID> {
    List<MaintenanceRecord> findByInspectionId(UUID inspectionId);
    List<MaintenanceRecord> findByTransformerId(UUID transformerId);
}
