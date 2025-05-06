/**
 * SSEClient - A library for handling Server-Sent Events in React applications
 * Provides hooks for connecting, receiving events, and managing the connection state
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Creates an SSE client instance that can be used to connect to an SSE endpoint
 * @param {string} baseUrl - The base URL of the SSE server
 * @returns {Object} - A client object with methods to interact with the SSE connection
 */
export const createSSEClient = (baseUrl) => {
  // Get the backend URL based on environment
  const getBackendUrl = () => {
    const hostname = window.location.hostname;
    
    // For Replit, we need to handle the special domain
    if (hostname.includes('.replit.dev') || hostname.includes('.repl.co')) {
      // We need to use the same hostname but different port (8000)
      return `https://${hostname.replace('5000', '8000')}`;
    }
    
    // For localhost/development, use localhost:8000
    return `http://${hostname}:8000`;
  };

  // If no baseUrl is provided, use auto-detected backend URL
  const defaultBaseUrl = getBackendUrl();
  console.log('Auto-detected backend URL:', defaultBaseUrl);
  // Remove trailing slash if present
  const normalizedBaseUrl = baseUrl ? 
    (baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl) : 
    defaultBaseUrl;
  
  console.log('Using SSE server URL:', normalizedBaseUrl);
  return {
    /**
     * Connect to the SSE server
     * @param {string} clientId - Optional client ID (server will generate one if not provided)
     * @returns {EventSource} - The EventSource instance
     */
    connect: (clientId) => {
      const url = `${normalizedBaseUrl}/api/sse/connect${clientId ? `?clientId=${clientId}` : ''}`;
      return new EventSource(url);
    },

    /**
     * Send an event to a specific client via regular HTTP request
     * @param {string} clientId - The client ID to send the event to
     * @param {string} eventType - The type of event
     * @param {any} data - The data to send
     * @returns {Promise} - Promise resolving to the response
     */
    sendEvent: (clientId, eventType, data) => {
      return fetch(`${normalizedBaseUrl}/api/sse/send/${clientId}?eventType=${eventType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }).then(response => response.json());
    },

    /**
     * Broadcast an event to all connected clients
     * @param {string} eventType - The type of event
     * @param {any} data - The data to send
     * @returns {Promise} - Promise resolving to the response
     */
    broadcastEvent: (eventType, data) => {
      return fetch(`${normalizedBaseUrl}/api/sse/broadcast?eventType=${eventType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }).then(response => response.json());
    },

    /**
     * Close the connection for a specific client
     * @param {string} clientId - The client ID to close the connection for
     * @returns {Promise} - Promise resolving to the response
     */
    closeConnection: (clientId) => {
      return fetch(`${normalizedBaseUrl}/api/sse/close/${clientId}`, {
        method: 'DELETE',
      }).then(response => response.json());
    },

    /**
     * Get information about connected clients
     * @returns {Promise} - Promise resolving to the response
     */
    getConnectedClients: () => {
      return fetch(`${normalizedBaseUrl}/api/sse/clients`).then(response => response.json());
    },

    /**
     * Check if a specific client is connected
     * @param {string} clientId - The client ID to check
     * @returns {Promise} - Promise resolving to the response
     */
    isClientConnected: (clientId) => {
      return fetch(`${normalizedBaseUrl}/api/sse/clients/${clientId}`).then(response => response.json());
    }
  };
};

/**
 * Hook to use SSE in React components
 * @param {string} baseUrl - The base URL of the SSE server
 * @param {string} initialClientId - Optional initial client ID
 * @param {Object} options - Configuration options
 * @returns {Object} - Hook state and methods
 */
export const useSSE = (baseUrl, initialClientId = null, options = {}) => {
  const { 
    autoConnect = true,
    reconnectOnError = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5
  } = options;

  const [clientId, setClientId] = useState(initialClientId);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  
  const eventSourceRef = useRef(null);
  const eventHandlersRef = useRef({});
  const reconnectTimeoutRef = useRef(null);
  const sseClient = useRef(createSSEClient(baseUrl));

  /**
   * Connect to the SSE server
   */
  const connect = useCallback(() => {
    // Clear any existing connection
    if (eventSourceRef.current) {
      disconnect();
    }

    try {
      setError(null);
      eventSourceRef.current = sseClient.current.connect(clientId);
      
      // Handle connection open
      eventSourceRef.current.onopen = () => {
        setConnected(true);
        setReconnectCount(0);
        console.log('SSE connection established');
      };

      // Handle connection error
      eventSourceRef.current.onerror = (err) => {
        console.error('SSE connection error:', err);
        setError(err);
        setConnected(false);
        
        // Cleanup
        eventSourceRef.current?.close();
        eventSourceRef.current = null;
        
        // Attempt to reconnect if enabled
        if (reconnectOnError && reconnectCount < maxReconnectAttempts) {
          console.log(`Reconnecting in ${reconnectInterval}ms (attempt ${reconnectCount + 1}/${maxReconnectAttempts})...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectCount(prev => prev + 1);
            connect();
          }, reconnectInterval);
        }
      };

      // Handle message (default event)
      eventSourceRef.current.onmessage = (event) => {
        const parsedData = JSON.parse(event.data);
        const newEvent = {
          id: event.lastEventId,
          type: 'message',
          data: parsedData,
          timestamp: new Date()
        };
        
        setLastEvent(newEvent);
        setEvents(prev => [...prev, newEvent]);
        
        // Call any registered handlers for the 'message' event
        if (eventHandlersRef.current.message) {
          eventHandlersRef.current.message(newEvent);
        }
      };

      // Handle 'connect' event specifically to set client ID
      eventSourceRef.current.addEventListener('connect', (event) => {
        const parsedData = JSON.parse(event.data);
        if (parsedData.clientId && !clientId) {
          setClientId(parsedData.clientId);
        }
        
        const newEvent = {
          id: event.lastEventId,
          type: 'connect',
          data: parsedData,
          timestamp: new Date()
        };
        
        setLastEvent(newEvent);
        setEvents(prev => [...prev, newEvent]);
        
        // Call any registered handlers for the 'connect' event
        if (eventHandlersRef.current.connect) {
          eventHandlersRef.current.connect(newEvent);
        }
      });
    } catch (err) {
      console.error('Failed to connect to SSE server:', err);
      setError(err);
    }
  }, [baseUrl, clientId, reconnectOnError, reconnectInterval, maxReconnectAttempts, reconnectCount]);

  /**
   * Disconnect from the SSE server
   */
  const disconnect = useCallback(() => {
    // Clear any reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Close the connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnected(false);
      console.log('SSE connection closed');
      
      // Also tell the server to close the connection if we have a client ID
      if (clientId) {
        sseClient.current.closeConnection(clientId)
          .then(response => console.log('Server connection closed:', response))
          .catch(err => console.error('Error closing server connection:', err));
      }
    }
  }, [clientId]);

  /**
   * Register an event handler for a specific event type
   * @param {string} eventType - The type of event to listen for
   * @param {Function} handler - The handler function to call when the event is received
   */
  const addEventListener = useCallback((eventType, handler) => {
    // Store the handler in our ref
    eventHandlersRef.current[eventType] = handler;
    
    // If we already have an event source, add the handler directly
    if (eventSourceRef.current && eventType !== 'message') {
      eventSourceRef.current.addEventListener(eventType, (event) => {
        const parsedData = JSON.parse(event.data);
        const newEvent = {
          id: event.lastEventId,
          type: eventType,
          data: parsedData,
          timestamp: new Date()
        };
        
        setLastEvent(newEvent);
        setEvents(prev => [...prev, newEvent]);
        handler(newEvent);
      });
    }
  }, []);

  /**
   * Remove an event handler for a specific event type
   * @param {string} eventType - The type of event to stop listening for
   */
  const removeEventListener = useCallback((eventType) => {
    // Remove from our ref
    delete eventHandlersRef.current[eventType];
    
    // If we have an event source, remove the listener
    if (eventSourceRef.current && eventType !== 'message') {
      eventSourceRef.current.removeEventListener(eventType);
    }
  }, []);

  /**
   * Clear all received events from state
   */
  const clearEvents = useCallback(() => {
    setEvents([]);
    setLastEvent(null);
  }, []);

  // Connect on mount if autoConnect is true
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Return the hook API
  return {
    // State
    clientId,
    connected,
    error,
    events,
    lastEvent,
    reconnectCount,
    
    // Methods
    connect,
    disconnect,
    addEventListener,
    removeEventListener,
    clearEvents,
    
    // SSE Client methods
    sendEvent: sseClient.current.sendEvent,
    broadcastEvent: sseClient.current.broadcastEvent,
    closeConnection: sseClient.current.closeConnection,
    getConnectedClients: sseClient.current.getConnectedClients,
    isClientConnected: sseClient.current.isClientConnected
  };
};

export default {
  createSSEClient,
  useSSE
};
