package com.transformer.management.service.engine;

import com.transformer.management.dto.AnomalyDetectionDTO;
import com.transformer.management.dto.ExternalAnomalyRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.util.*;

/**
 * HuggingFace API implementation of the AnomalyDetectionEngine interface
 * Current production implementation using the Senum anomaly detection API
 */
@Component("huggingFaceEngine")
public class HuggingFaceAnomalyEngine implements AnomalyDetectionEngine {
    private static final Logger logger = LoggerFactory.getLogger(HuggingFaceAnomalyEngine.class);
    
    private static final String ENGINE_NAME = "HuggingFace";
    private static final String ENGINE_VERSION = "1.0.0";
    private static final String MODEL_NAME = "Senum-Anomaly-Detection";
    
    private static final String ANOMALY_API_BASE_URL = "https://Senum-anomaly-detection-api.hf.space";
    private static final String INFER_ENDPOINT = ANOMALY_API_BASE_URL + "/infer";
    private static final String HEALTH_ENDPOINT = ANOMALY_API_BASE_URL + "/health";

    @Autowired
    private RestTemplate restTemplate;

    @Override
    public String getEngineName() {
        return ENGINE_NAME;
    }

    @Override
    public String getEngineVersion() {
        return ENGINE_VERSION;
    }

    @Override
    public String getModelName() {
        return MODEL_NAME;
    }

    @Override
    public boolean isAvailable() {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(HEALTH_ENDPOINT, Map.class);
            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            logger.warn("HuggingFace engine health check failed: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public AnomalyDetectionDTO detectAnomaly(String imageUrl) {
        logger.info("HuggingFace engine detecting anomalies in image: {}", imageUrl);
        
        try {
            // Prepare request
            ExternalAnomalyRequest request = new ExternalAnomalyRequest(imageUrl);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<ExternalAnomalyRequest> entity = new HttpEntity<>(request, headers);

            // Call external API
            long startTime = System.currentTimeMillis();
            ResponseEntity<Map> response = restTemplate.postForEntity(INFER_ENDPOINT, entity, Map.class);
            long processingTime = System.currentTimeMillis() - startTime;
            
            logger.info("HuggingFace API responded in {}ms with status: {}", processingTime, response.getStatusCode());

            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                throw new RuntimeException("HuggingFace API returned non-OK status or empty body");
            }

            Map<String, Object> responseBody = response.getBody();
            
            // Map response to DTO
            return mapResponseToDTO(responseBody);
            
        } catch (RestClientException e) {
            logger.error("HuggingFace engine error calling external API: {}", e.getMessage(), e);
            throw new RuntimeException("HuggingFace anomaly detection failed: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> getEngineMetadata() {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("name", ENGINE_NAME);
        metadata.put("version", ENGINE_VERSION);
        metadata.put("model", MODEL_NAME);
        metadata.put("apiUrl", ANOMALY_API_BASE_URL);
        metadata.put("available", isAvailable());
        metadata.put("supportedFormats", Arrays.asList("JPEG", "PNG"));
        metadata.put("maxImageSize", "10MB");
        metadata.put("avgResponseTime", "2-5 seconds");
        return metadata;
    }

    /**
     * Map the external API response to our internal DTO format
     */
    private AnomalyDetectionDTO mapResponseToDTO(Map<String, Object> responseBody) {
        AnomalyDetectionDTO dto = new AnomalyDetectionDTO();

        // Extract image URLs
        dto.setOverlayImage((String) responseBody.get("boxed_url"));
        dto.setHeatmapImage((String) responseBody.get("filtered_url"));
        dto.setMaskImage((String) responseBody.get("mask_url"));
        dto.setLabel((String) responseBody.get("label"));

        // Extract detections
        List<Map<String, Object>> boxesList = (List<Map<String, Object>>) responseBody.get("boxes");
        List<AnomalyDetectionDTO.Detection> detections = new ArrayList<>();

        if (boxesList != null) {
            for (Map<String, Object> boxData : boxesList) {
                List<Integer> box = (List<Integer>) boxData.get("box");
                String type = (String) boxData.get("type");
                
                // Extract confidence - handle both Double and Integer
                Object confidenceObj = boxData.get("confidence");
                double confidence = 0.0;
                if (confidenceObj instanceof Double) {
                    confidence = (Double) confidenceObj;
                } else if (confidenceObj instanceof Integer) {
                    confidence = ((Integer) confidenceObj).doubleValue();
                } else if (confidenceObj instanceof Number) {
                    confidence = ((Number) confidenceObj).doubleValue();
                }

                // Convert box to int array
                int[] bbox = new int[4];
                if (box != null && box.size() >= 4) {
                    for (int i = 0; i < 4; i++) {
                        bbox[i] = box.get(i);
                    }
                }

                AnomalyDetectionDTO.Detection detection = new AnomalyDetectionDTO.Detection(bbox, type, confidence);
                detections.add(detection);
            }
        }

        dto.setDetections(detections);
        logger.info("HuggingFace engine mapped {} detections from API response", detections.size());
        
        return dto;
    }
}
