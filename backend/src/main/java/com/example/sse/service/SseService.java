package com.example.sse.service;

import com.example.sse.model.Event;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SseService {

    private static final Logger log = LoggerFactory.getLogger(SseService.class);
    private final Map<String, Sinks.Many<ServerSentEvent<Object>>> sinks = new ConcurrentHashMap<>();

    /**
     * Creates a new event stream for the specified client ID.
     * @param clientId The client ID to create a stream for
     * @return Flux of ServerSentEvent to be consumed by the client
     */
    public Flux<ServerSentEvent<Object>> createStream(String clientId) {
        Sinks.Many<ServerSentEvent<Object>> sink = Sinks.many().multicast().onBackpressureBuffer();
        sinks.put(clientId, sink);
        
        log.info("Created new SSE stream for client: {}", clientId);
        
        return sink.asFlux()
                .doOnCancel(() -> {
                    log.info("Client {} cancelled the connection", clientId);
                    closeConnection(clientId);
                })
                .doOnComplete(() -> {
                    log.info("Stream completed for client: {}", clientId);
                    sinks.remove(clientId);
                })
                .doOnError(e -> {
                    log.error("Error in stream for client {}: {}", clientId, e.getMessage());
                    sinks.remove(clientId);
                });
    }

    /**
     * Publishes an event to a specific client
     * @param clientId The client ID to send the event to
     * @param event The event to send
     * @return boolean indicating if the event was sent successfully
     */
    public boolean sendEvent(String clientId, Event<?> event) {
        Sinks.Many<ServerSentEvent<Object>> sink = sinks.get(clientId);
        if (sink == null) {
            log.warn("No connection found for client {}", clientId);
            return false;
        }

        ServerSentEvent<Object> serverSentEvent = ServerSentEvent.builder()
                .id(event.getId())
                .event(event.getEventType())
                .data(event.getData())
                .build();

        Sinks.EmitResult result = sink.tryEmitNext(serverSentEvent);
        
        if (result.isFailure()) {
            log.error("Failed to send event to client {}: {}", clientId, result);
            return false;
        }
        
        log.info("Event sent to client {}: {}", clientId, event);
        return true;
    }

    /**
     * Broadcasts an event to all connected clients
     * @param event The event to broadcast
     */
    public void broadcastEvent(Event<?> event) {
        sinks.forEach((clientId, sink) -> {
            ServerSentEvent<Object> serverSentEvent = ServerSentEvent.builder()
                    .id(event.getId())
                    .event(event.getEventType())
                    .data(event.getData())
                    .build();
            
            Sinks.EmitResult result = sink.tryEmitNext(serverSentEvent);
            
            if (result.isFailure()) {
                log.error("Failed to broadcast event to client {}: {}", clientId, result);
            }
        });
        
        log.info("Event broadcasted to {} clients: {}", sinks.size(), event);
    }

    /**
     * Closes the connection for a specific client
     * @param clientId The client ID to close the connection for
     * @return boolean indicating if the connection was closed successfully
     */
    public boolean closeConnection(String clientId) {
        Sinks.Many<ServerSentEvent<Object>> sink = sinks.remove(clientId);
        if (sink != null) {
            Sinks.EmitResult result = sink.tryEmitComplete();
            log.info("Connection closed for client {}: {}", clientId, result);
            return !result.isFailure();
        }
        
        log.warn("No connection found to close for client {}", clientId);
        return false;
    }

    /**
     * Closes all connections
     */
    public void closeAllConnections() {
        sinks.forEach((clientId, sink) -> {
            Sinks.EmitResult result = sink.tryEmitComplete();
            log.info("Connection closed for client {}: {}", clientId, result);
        });
        sinks.clear();
        log.info("All connections closed");
    }

    /**
     * Checks if a client is connected
     * @param clientId The client ID to check
     * @return boolean indicating if the client is connected
     */
    public boolean isClientConnected(String clientId) {
        return sinks.containsKey(clientId);
    }

    /**
     * Gets the number of connected clients
     * @return The number of connected clients
     */
    public int getConnectedClientsCount() {
        return sinks.size();
    }

    /**
     * Gets a list of all connected client IDs
     * @return An array of client IDs
     */
    public String[] getConnectedClientIds() {
        return sinks.keySet().toArray(new String[0]);
    }
}
