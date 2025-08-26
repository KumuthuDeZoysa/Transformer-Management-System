package com.transformer.management.controller;

import com.transformer.management.dto.TransformerRequest;
import com.transformer.management.entity.Transformer;
import com.transformer.management.service.TransformerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Optional;

/**
 * REST Controller for Transformer operations
 */
@RestController
@RequestMapping("/transformers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TransformerController {

    private final TransformerService transformerService;

    /**
     * Create a new transformer
     * POST /transformers
     *
     * @param transformerRequest The transformer data to create
     * @return Created transformer with 201 status
     */
    @PostMapping
    public ResponseEntity<Transformer> createTransformer(@Valid @RequestBody TransformerRequest transformerRequest) {
        try {
            Transformer transformer = new Transformer();
            transformer.setTransformerId(transformerRequest.getTransformerId());
            transformer.setLocation(transformerRequest.getLocation());
            transformer.setCapacity(transformerRequest.getCapacity());

            Transformer savedTransformer = transformerService.addTransformer(transformer);
            return new ResponseEntity<>(savedTransformer, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get all transformers
     * GET /transformers
     *
     * @return List of all transformers
     */
    @GetMapping
    public ResponseEntity<List<Transformer>> getAllTransformers() {
        try {
            List<Transformer> transformers = transformerService.listAllTransformers();
            if (transformers.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            }
            return new ResponseEntity<>(transformers, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get transformer by database ID
     * GET /transformers/{id}
     *
     * @param id The transformer database ID
     * @return Transformer if found, 404 if not found
     */
    @GetMapping("/{id}")
    public ResponseEntity<Transformer> getTransformerById(@PathVariable("id") Long id) {
        try {
            Optional<Transformer> transformer = transformerService.findById(id);
            if (transformer.isPresent()) {
                return new ResponseEntity<>(transformer.get(), HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get transformer by transformer ID (alternative endpoint)
     * GET /transformers/by-transformer-id/{transformerId}
     *
     * @param transformerId The unique transformer identifier
     * @return Transformer if found, 404 if not found
     */
    @GetMapping("/by-transformer-id/{transformerId}")
    public ResponseEntity<Transformer> getTransformerByTransformerId(@PathVariable("transformerId") String transformerId) {
        try {
            Optional<Transformer> transformer = transformerService.findByTransformerId(transformerId);
            if (transformer.isPresent()) {
                return new ResponseEntity<>(transformer.get(), HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update transformer by database ID
     * PUT /transformers/{id}
     *
     * @param id The transformer database ID
     * @param transformerRequest The updated transformer data
     * @return Updated transformer if successful, 404 if not found
     */
    @PutMapping("/{id}")
    public ResponseEntity<Transformer> updateTransformer(@PathVariable("id") Long id, 
                                                        @Valid @RequestBody TransformerRequest transformerRequest) {
        try {
            Optional<Transformer> existingTransformer = transformerService.findById(id);
            if (existingTransformer.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

            Transformer transformer = existingTransformer.get();
            transformer.setTransformerId(transformerRequest.getTransformerId());
            transformer.setLocation(transformerRequest.getLocation());
            transformer.setCapacity(transformerRequest.getCapacity());

            Transformer updatedTransformer = transformerService.updateTransformer(transformer);
            return new ResponseEntity<>(updatedTransformer, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete transformer by database ID
     * DELETE /transformers/{id}
     *
     * @param id The transformer database ID
     * @return 204 if successful, 404 if not found
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<HttpStatus> deleteTransformer(@PathVariable("id") Long id) {
        try {
            Optional<Transformer> transformer = transformerService.findById(id);
            if (transformer.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

            transformerService.deleteTransformer(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete transformer by transformer ID (alternative endpoint)
     * DELETE /transformers/by-transformer-id/{transformerId}
     *
     * @param transformerId The unique transformer identifier
     * @return 204 if successful, 404 if not found
     */
    @DeleteMapping("/by-transformer-id/{transformerId}")
    public ResponseEntity<HttpStatus> deleteTransformerByTransformerId(@PathVariable("transformerId") String transformerId) {
        try {
            if (!transformerService.existsByTransformerId(transformerId)) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

            transformerService.deleteTransformerByTransformerId(transformerId);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Search transformers by location
     * GET /transformers/search?location={location}
     *
     * @param location The location to search for
     * @return List of transformers matching the location
     */
    @GetMapping("/search")
    public ResponseEntity<List<Transformer>> searchTransformersByLocation(@RequestParam("location") String location) {
        try {
            List<Transformer> transformers = transformerService.searchByLocation(location);
            if (transformers.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            }
            return new ResponseEntity<>(transformers, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get transformer count
     * GET /transformers/count
     *
     * @return Total number of transformers
     */
    @GetMapping("/count")
    public ResponseEntity<Long> getTransformerCount() {
        try {
            long count = transformerService.getTotalCount();
            return new ResponseEntity<>(count, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
