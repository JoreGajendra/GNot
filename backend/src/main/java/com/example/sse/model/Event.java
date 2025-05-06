package com.example.sse.model;

import java.time.LocalDateTime;
import java.util.Objects;

public class Event<T> {
    private String id;
    private String eventType;
    private T data;
    private LocalDateTime timestamp;

    public Event() {
    }

    public Event(String id, String eventType, T data, LocalDateTime timestamp) {
        this.id = id;
        this.eventType = eventType;
        this.data = data;
        this.timestamp = timestamp;
    }

    public static <T> Event<T> of(String id, String eventType, T data) {
        return new Event<>(id, eventType, data, LocalDateTime.now());
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Event<?> event = (Event<?>) o;
        return Objects.equals(id, event.id) &&
                Objects.equals(eventType, event.eventType) &&
                Objects.equals(data, event.data) &&
                Objects.equals(timestamp, event.timestamp);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, eventType, data, timestamp);
    }

    @Override
    public String toString() {
        return "Event{" +
                "id='" + id + '\'' +
                ", eventType='" + eventType + '\'' +
                ", data=" + data +
                ", timestamp=" + timestamp +
                '}';
    }
}
