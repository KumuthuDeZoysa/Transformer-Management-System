package com.transformer.management.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * JPA Configuration class to enable JPA repositories
 */
@Configuration
@EnableJpaRepositories(basePackages = "com.transformer.management.repository")
public class JpaConfig {
    // JPA configuration can be extended here if needed
}
