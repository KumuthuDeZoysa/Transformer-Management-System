package com.transformer.management.dto;

import com.transformer.management.enums.ImageType;
import com.transformer.management.enums.WeatherCondition;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

/**
 * DTO for image upload requests
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImageUploadRequest {

    @NotBlank(message = "Transformer ID is required")
    private String transformerId;

    @NotBlank(message = "Image URL is required")
    private String imageUrl;

    @NotNull(message = "Image type is required")
    private ImageType imageType;

    @NotNull(message = "Weather condition is required")
    private WeatherCondition condition;

    @NotBlank(message = "Uploader name is required")
    private String uploader;
}
