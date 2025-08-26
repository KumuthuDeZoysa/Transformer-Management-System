package com.transformer.management.entity;

import com.transformer.management.enums.ImageType;
import com.transformer.management.enums.WeatherCondition;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.sql.Timestamp;

/**
 * JPA Entity representing an Image associated with a Transformer
 */
@Entity
@Table(name = "images")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Image {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transformer_id", nullable = false)
    private Transformer transformer;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "image_type", nullable = false)
    private ImageType imageType;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition", nullable = false)
    private WeatherCondition condition;

    @Column(name = "uploader", nullable = false)
    private String uploader;

    @CreationTimestamp
    @Column(name = "upload_time", nullable = false, updatable = false)
    private Timestamp uploadTime;
}
