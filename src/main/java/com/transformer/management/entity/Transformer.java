package com.transformer.management.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.sql.Timestamp;
import java.util.List;

/**
 * JPA Entity representing a Transformer
 */
@Entity
@Table(name = "transformers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Transformer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transformer_id", unique = true, nullable = false)
    private String transformerId;

    @Column(name = "location", nullable = false)
    private String location;

    @Column(name = "capacity", nullable = false)
    private String capacity;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Timestamp createdAt;

    @OneToMany(mappedBy = "transformer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Image> images;
}
