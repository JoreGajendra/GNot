package com.example.sse.controller;

import com.example.sse.model.Event;
import com.example.sse.service.SseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sse")
@CrossOrigin(origins = "*") // For development - restrict in production
public class SseController {

    private static final Logger log = LoggerFactory.getLogger(SseController.class);
    private final SseService sseService;

    @Autowired
    public SseController(SseService sseService) {
        this.sseService = sseService;
    }

    /**
     * Endpoint to establish SSE connection
     * @param clientId Optional client ID (will be generated if not provided)
     * @return Flux of ServerSentEvent
     */
    @GetMapping(value = "/connect", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<Object>> connect(@RequestParam(required = false) String clientId) {
        // Generate client ID if not provided
        String actualClientId = clientId != null ? clientId : UUID.randomUUID().toString();
        log.info("Client connecting with ID: {}", actualClientId);
        
        // Send initial connection established event
        Flux<ServerSentEvent<Object>> stream = sseService.createStream(actualClientId);
        
        // Initial message to confirm connection is established
        Event<Map<String, Object>> connectEvent = Event.of(
                UUID.randomUUID().toString(),
                "connect",
                Map.of(
                        "message", "Connection established",
                        "clientId", actualClientId,
                        "timestamp", LocalDateTime.now().toString()
                )
        );
        
        sseService.sendEvent(actualClientId, connectEvent);
        
        return stream;
    }

    /**
     * Endpoint to send an event to a specific client
     * @param clientId The client ID to send the event to
     * @param eventType The type of event
     * @param data The data to send
     * @return ResponseEntity with success/failure status
     */
    @PostMapping("/send/{clientId}")
    public Mono<ResponseEntity<Map<String, Object>>> sendEvent(
            @PathVariable String clientId,
            @RequestParam String eventType,
            @RequestBody Object data) {
        
        Event<Object> event = Event.of(
                UUID.randomUUID().toString(),
                eventType,
                data
        );
        
        boolean sent = sseService.sendEvent(clientId, event);
        
        if (sent) {
            return Mono.just(ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Event sent to client: " + clientId,
                    "eventId", event.getId()
            )));
        } else {
            return Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "message", "Client not found or event could not be sent: " + clientId
            )));
        }
    }

    /**
     * Endpoint to broadcast an event to all connected clients
     * @param eventType The type of event
     * @param data The data to send
     * @return ResponseEntity with success status
     */
    @PostMapping("/broadcast")
    public Mono<ResponseEntity<Map<String, Object>>> broadcastEvent(
            @RequestParam String eventType,
            @RequestBody Object data) {
        
        Event<Object> event = Event.of(
                UUID.randomUUID().toString(),
                eventType,
                data
        );
        
        sseService.broadcastEvent(event);
        
        return Mono.just(ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Event broadcasted to all clients",
                "eventId", event.getId(),
                "recipientCount", sseService.getConnectedClientsCount()
        )));
    }

    /**
     * Endpoint to close a specific client connection
     * @param clientId The client ID to close the connection for
     * @return ResponseEntity with success/failure status
     */
    @DeleteMapping("/close/{clientId}")
    public Mono<ResponseEntity<Map<String, Object>>> closeConnection(@PathVariable String clientId) {
        boolean closed = sseService.closeConnection(clientId);
        
        if (closed) {
            return Mono.just(ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Connection closed for client: " + clientId
            )));
        } else {
            return Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "message", "Client not found: " + clientId
            )));
        }
    }

    /**
     * Endpoint to close all client connections
     * @return ResponseEntity with success status
     */
    @DeleteMapping("/close-all")
    public Mono<ResponseEntity<Map<String, Object>>> closeAllConnections() {
        int count = sseService.getConnectedClientsCount();
        sseService.closeAllConnections();
        
        return Mono.just(ResponseEntity.ok(Map.of(
                "success", true,
                "message", "All connections closed",
                "closedCount", count
        )));
    }

    /**
     * Endpoint to get information about connected clients
     * @return ResponseEntity with client information
     */
    @GetMapping("/clients")
    public Mono<ResponseEntity<Map<String, Object>>> getConnectedClients() {
        return Mono.just(ResponseEntity.ok(Map.of(
                "count", sseService.getConnectedClientsCount(),
                "clients", sseService.getConnectedClientIds()
        )));
    }

    /**
     * Endpoint to check if a specific client is connected
     * @param clientId The client ID to check
     * @return ResponseEntity with connection status
     */
    @GetMapping("/clients/{clientId}")
    public Mono<ResponseEntity<Map<String, Object>>> isClientConnected(@PathVariable String clientId) {
        boolean connected = sseService.isClientConnected(clientId);
        
        return Mono.just(ResponseEntity.ok(Map.of(
                "clientId", clientId,
                "connected", connected
        )));
    }
}
