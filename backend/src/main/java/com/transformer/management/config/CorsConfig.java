package com.transformer.management.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")  // Map all endpoints since context path is /api
                .allowedOrigins(
                    "http://localhost:3000",  // Next.js dev server
                    "http://localhost:3001",  // Next.js dev server (actual port)
                    "http://127.0.0.1:3000",  // Alternative localhost
                    "http://127.0.0.1:3001",  // Alternative localhost
                    "https://localhost:3000",  // HTTPS if needed
                    "https://localhost:3001"   // HTTPS if needed
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")  // Allow all headers
                .exposedHeaders("Authorization", "Content-Type", "X-Requested-With")
                .allowCredentials(true)
                .maxAge(3600); // Cache preflight for 1 hour
    }
}
