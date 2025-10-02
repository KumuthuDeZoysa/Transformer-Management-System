package com.transformer.management.controller;

import com.transformer.management.entity.Transformer;
import com.transformer.management.entity.User;
import com.transformer.management.repository.TransformerRepository;
import com.transformer.management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/seed")
public class SeedController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransformerRepository transformerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping
    public ResponseEntity<?> seedData() {
        // Seed users
        if (userRepository.count() == 0) {
            User admin = new User("admin", passwordEncoder.encode("admin123"), "admin");
            User user = new User("user", passwordEncoder.encode("user123"), "user");
            userRepository.save(admin);
            userRepository.save(user);
        }

        // Seed transformers
        if (transformerRepository.count() == 0) {
            Transformer transformer1 = new Transformer(
                "TRF-001", "Pole-001", "North Region", "Distribution",
                "500 kVA", "Main Street", "Normal"
            );
            
            Transformer transformer2 = new Transformer(
                "TRF-002", "Pole-002", "South Region", "Distribution", 
                "300 kVA", "Oak Avenue", "Normal"
            );
            
            Transformer transformer3 = new Transformer(
                "TRF-003", "Pole-003", "East Region", "Power",
                "1000 kVA", "Pine Road", "Maintenance Required"
            );

            transformerRepository.save(transformer1);
            transformerRepository.save(transformer2);
            transformerRepository.save(transformer3);
        }

        return ResponseEntity.ok(Map.of("message", "Database seeded successfully"));
    }
}
