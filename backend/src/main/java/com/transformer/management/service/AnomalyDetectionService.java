package com.transformer.management.service;

import com.transformer.management.dto.ExternalAnomalyRequest;
import com.transformer.management.dto.AnomalyDetectionDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AnomalyDetectionService {
    private static final Logger logger = LoggerFactory.getLogger(AnomalyDetectionService.class);
    
    private static final String ANOMALY_API_BASE_URL = "https://Senum-anomaly-detection-api.hf.space";
    private static final String INFER_ENDPOINT = ANOMALY_API_BASE_URL + "/infer";
    private static final String HEALTH_ENDPOINT = ANOMALY_API_BASE_URL + "/health";

    @Autowired
    private RestTemplate restTemplate;

    /**
     * Detect anomalies in the given image by calling the external Hugging Face API
     * 
     * @param imageUrl The URL of the image to analyze
     * @return The mapped response as AnomalyDetectionDTO
     * @throws RuntimeException if the API call fails
     */
    public AnomalyDetectionDTO detectAnomaly(String imageUrl) {
        logger.info("Calling anomaly detection API for image: {}", imageUrl);
        
        try {
            // Prepare the request body
            ExternalAnomalyRequest request = new ExternalAnomalyRequest(imageUrl);
            
            // Set up headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Create the HTTP entity
            HttpEntity<ExternalAnomalyRequest> entity = new HttpEntity<>(request, headers);
            
            // Make the POST request to the external API
            ResponseEntity<Map> response = restTemplate.exchange(
                INFER_ENDPOINT,
                HttpMethod.POST,
                entity,
                Map.class
            );
            
            logger.info("Anomaly detection API returned status: {}", response.getStatusCode());
            
            // Map the response to our DTO
            return mapToDTO(response.getBody());
            
        } catch (RestClientException e) {
            logger.error("Error calling anomaly detection API: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to detect anomaly: " + e.getMessage(), e);
        }
    }

    /**
     * Map the external API response to our DTO format
     * External API returns:
     * {
     *   "boxed_url": "...",
     *   "boxes": [{"box": [x,y,w,h], "type": "..."}],
     *   "filtered_url": "...",
     *   "label": "Normal",
     *   "mask_url": "..."
     * }
     * 
     * @param externalResponse The raw response from the external API
     * @return Mapped AnomalyDetectionDTO
     */
    private AnomalyDetectionDTO mapToDTO(Map<String, Object> externalResponse) {
        if (externalResponse == null) {
            logger.warn("External API returned null response");
            return new AnomalyDetectionDTO();
        }

        AnomalyDetectionDTO dto = new AnomalyDetectionDTO();
        
        // Map image URLs
        dto.setOverlayImage((String) externalResponse.get("boxed_url"));
        dto.setHeatmapImage((String) externalResponse.get("filtered_url"));
        dto.setMaskImage((String) externalResponse.get("mask_url"));
        dto.setLabel((String) externalResponse.get("label"));
        
        // Map detections/boxes
        List<AnomalyDetectionDTO.Detection> detections = new ArrayList<>();
        Object boxesObj = externalResponse.get("boxes");
        
        if (boxesObj instanceof List) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> boxes = (List<Map<String, Object>>) boxesObj;
            
            for (Map<String, Object> boxData : boxes) {
                try {
                    // Extract box coordinates [x, y, w, h]
                    Object boxObj = boxData.get("box");
                    int[] bbox = null;
                    
                    if (boxObj instanceof List) {
                        @SuppressWarnings("unchecked")
                        List<Number> boxList = (List<Number>) boxObj;
                        bbox = new int[boxList.size()];
                        for (int i = 0; i < boxList.size(); i++) {
                            bbox[i] = boxList.get(i).intValue();
                        }
                    }
                    
                    String type = (String) boxData.get("type");
                    
                    // Extract confidence score (default to 0.0 if not present)
                    double confidence = 0.0;
                    if (boxData.get("confidence") != null) {
                        Object confObj = boxData.get("confidence");
                        if (confObj instanceof Number) {
                            confidence = ((Number) confObj).doubleValue();
                        }
                    }
                    
                    if (bbox != null && type != null) {
                        detections.add(new AnomalyDetectionDTO.Detection(bbox, type, confidence));
                    }
                } catch (Exception e) {
                    logger.warn("Failed to parse detection box: {}", e.getMessage());
                }
            }
        }
        
        dto.setDetections(detections);
        
        logger.info("Mapped response: label={}, detections={}", dto.getLabel(), detections.size());
        return dto;
    }

    /**
     * Check the health status of the external anomaly detection API
     * 
     * @return Health status as a Map
     * @throws RuntimeException if the health check fails
     */
    public Map<String, Object> checkHealth() {
        logger.info("Checking health of anomaly detection API");
        
        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                HEALTH_ENDPOINT,
                HttpMethod.GET,
                null,
                Map.class
            );
            
            logger.info("Health check returned status: {}", response.getStatusCode());
            return response.getBody();
            
        } catch (RestClientException e) {
            logger.error("Error checking health of anomaly detection API: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to check API health: " + e.getMessage(), e);
        }
    }
}
