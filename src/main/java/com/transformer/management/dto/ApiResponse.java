package com.transformer.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Standard API response wrapper
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    
    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;
    private int status;

    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, message, data, LocalDateTime.now(), 200);
    }

    public static <T> ApiResponse<T> success(T data) {
        return success(data, "Operation successful");
    }

    public static <T> ApiResponse<T> error(String message, int status) {
        return new ApiResponse<>(false, message, null, LocalDateTime.now(), status);
    }

    public static <T> ApiResponse<T> error(String message) {
        return error(message, 500);
    }
}
