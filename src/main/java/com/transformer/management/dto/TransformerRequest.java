package com.transformer.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;

/**
 * DTO for transformer requests
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransformerRequest {

    private String transformerId;

    @NotBlank(message = "Location is required")
    private String location;

    @NotBlank(message = "Capacity is required")
    private String capacity;
}
