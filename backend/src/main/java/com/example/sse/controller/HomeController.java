package com.example.sse.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Simple controller to handle the root path and provide API information
 */
@RestController
public class HomeController {
    
    @GetMapping(value = "/", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> home() {
        Map<String, Object> response = new HashMap<>();
        response.put("service", "SSE Demo Service");
        response.put("status", "running");
        response.put("version", "1.0.0");
        response.put("endpoints", new String[] {
            "/api/sse/connect - SSE connection endpoint",
            "/api/sse/clients - Get all connected clients",
            "/api/sse/clients/{clientId} - Check if a client is connected",
            "/api/sse/send/{clientId} - Send event to a specific client",
            "/api/sse/broadcast - Broadcast event to all clients",
            "/api/sse/close/{clientId} - Close a specific client connection",
            "/api/sse/close-all - Close all client connections"
        });
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping(value = "/health", produces = MediaType.APPLICATION_JSON_VALUE) 
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "up");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }
}