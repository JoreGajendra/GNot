import React, { useState, useEffect, useRef } from 'react';
import { useSSE } from '../lib/SSEClient';

function EventsContainer({ serverUrl }) {
  const [customEventType, setCustomEventType] = useState('user-event');
  const [customEventData, setCustomEventData] = useState('');
  const [broadcastData, setBroadcastData] = useState('');
  const [manualClientId, setManualClientId] = useState('');
  const [connectedClients, setConnectedClients] = useState([]);
  const [showAllEvents, setShowAllEvents] = useState(true);
  const [filterEventType, setFilterEventType] = useState('');
  
  const eventsEndRef = useRef(null);

  // Initialize SSE hook
  const sse = useSSE(serverUrl, null, {
    autoConnect: false,
    reconnectOnError: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5
  });

  // Register custom event handlers
  useEffect(() => {
    if (sse.connected) {
      // Add a handler for the custom event type
      sse.addEventListener('user-event', (event) => {
        console.log('Custom user event received:', event);
      });
      
      // Add a handler for system notifications
      sse.addEventListener('notification', (event) => {
        console.log('System notification received:', event);
      });
    }
    
    return () => {
      // Clean up event listeners
      sse.removeEventListener('user-event');
      sse.removeEventListener('notification');
    };
  }, [sse.connected, sse]);

  // Get connected clients periodically when connected
  useEffect(() => {
    let interval;
    if (sse.connected) {
      // Initial fetch
      fetchConnectedClients();
      
      // Set up interval
      interval = setInterval(fetchConnectedClients, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sse.connected]);

  // Auto-scroll to bottom when new events are received
  useEffect(() => {
    if (eventsEndRef.current) {
      eventsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sse.events]);

  // Function to fetch connected clients
  const fetchConnectedClients = () => {
    sse.getConnectedClients()
      .then(data => {
        setConnectedClients(data.clients || []);
      })
      .catch(err => console.error('Error fetching clients:', err));
  };

  // Function to handle connection
  const handleConnect = () => {
    sse.connect();
  };

  // Function to handle disconnection
  const handleDisconnect = () => {
    sse.disconnect();
  };

  // Function to send an event to a specific client
  const handleSendEvent = (e) => {
    e.preventDefault();
    if (!manualClientId) {
      alert('Please enter a client ID to send the event to');
      return;
    }
    
    try {
      const dataObj = customEventData.trim() ? JSON.parse(customEventData) : { message: 'Empty event' };
      sse.sendEvent(manualClientId, customEventType, dataObj)
        .then(response => {
          console.log('Event sent:', response);
          if (!response.success) {
            alert(`Failed to send event: ${response.message}`);
          }
          setCustomEventData('');
        })
        .catch(err => {
          console.error('Error sending event:', err);
          alert('Error sending event. See console for details.');
        });
    } catch (err) {
      alert('Invalid JSON data. Please check your input.');
      console.error('JSON parse error:', err);
    }
  };

  // Function to broadcast an event to all clients
  const handleBroadcast = (e) => {
    e.preventDefault();
    try {
      const dataObj = broadcastData.trim() ? JSON.parse(broadcastData) : { message: 'Broadcast message' };
      sse.broadcastEvent(customEventType, dataObj)
        .then(response => {
          console.log('Broadcast sent:', response);
          if (!response.success) {
            alert(`Failed to broadcast: ${response.message}`);
          }
          setBroadcastData('');
        })
        .catch(err => {
          console.error('Error broadcasting:', err);
          alert('Error broadcasting event. See console for details.');
        });
    } catch (err) {
      alert('Invalid JSON data. Please check your input.');
      console.error('JSON parse error:', err);
    }
  };

  // Filter events based on event type
  const filteredEvents = showAllEvents 
    ? sse.events 
    : filterEventType 
      ? sse.events.filter(event => event.type === filterEventType)
      : sse.events;

  return (
    <div className="row">
      <div className="col-md-8">
        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Event Stream</h5>
            <div>
              <span className={`badge ${sse.connected ? 'bg-success' : 'bg-danger'} me-2`}>
                {sse.connected ? 'Connected' : 'Disconnected'}
              </span>
              {sse.clientId && (
                <span className="badge bg-info me-2">
                  Client ID: {sse.clientId}
                </span>
              )}
            </div>
          </div>
          <div className="card-body">
            <div className="mb-3 d-flex gap-2">
              <button 
                className="btn btn-primary" 
                onClick={handleConnect} 
                disabled={sse.connected}
              >
                Connect
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleDisconnect} 
                disabled={!sse.connected}
              >
                Disconnect
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={sse.clearEvents}
              >
                Clear Events
              </button>
            </div>

            <div className="mb-3">
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  id="showAllEvents"
                  checked={showAllEvents}
                  onChange={() => setShowAllEvents(true)}
                />
                <label className="form-check-label" htmlFor="showAllEvents">Show All Events</label>
              </div>
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  id="filterEvents"
                  checked={!showAllEvents}
                  onChange={() => setShowAllEvents(false)}
                />
                <label className="form-check-label" htmlFor="filterEvents">Filter Events</label>
              </div>
              {!showAllEvents && (
                <input
                  type="text"
                  className="form-control form-control-sm mt-2"
                  placeholder="Filter by event type"
                  value={filterEventType}
                  onChange={(e) => setFilterEventType(e.target.value)}
                />
              )}
            </div>

            <div 
              className="border rounded p-3 bg-light" 
              style={{ 
                maxHeight: '400px', 
                overflowY: 'auto',
                fontSize: '0.875rem'
              }}
            >
              {filteredEvents.length === 0 ? (
                <p className="text-muted text-center my-5">No events received yet</p>
              ) : (
                filteredEvents.map((event, index) => (
                  <div key={index} className="mb-3 border-bottom pb-2">
                    <div className="d-flex justify-content-between">
                      <span className="badge bg-secondary">{event.type}</span>
                      <small className="text-muted">
                        {event.timestamp.toLocaleTimeString()}
                      </small>
                    </div>
                    <div className="mt-1">
                      <small className="text-muted">ID: {event.id}</small>
                    </div>
                    <pre className="mt-2 mb-0 bg-white p-2 rounded" style={{ fontSize: '0.8rem' }}>
                      {JSON.stringify(event.data, null, 2)}
                    </pre>
                  </div>
                ))
              )}
              <div ref={eventsEndRef} />
            </div>

            {sse.error && (
              <div className="alert alert-danger mt-3">
                <strong>Error:</strong> Connection error. 
                {sse.reconnectCount > 0 && (
                  <span> Reconnect attempt {sse.reconnectCount}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="col-md-4">
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Controls</h5>
          </div>
          <div className="card-body">
            <h6>Send Event to Client</h6>
            <form onSubmit={handleSendEvent}>
              <div className="mb-3">
                <label className="form-label">Client ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={manualClientId}
                  onChange={(e) => setManualClientId(e.target.value)}
                  placeholder="Enter client ID"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Event Type</label>
                <input
                  type="text"
                  className="form-control"
                  value={customEventType}
                  onChange={(e) => setCustomEventType(e.target.value)}
                  placeholder="Event type"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Data (JSON)</label>
                <textarea
                  className="form-control"
                  value={customEventData}
                  onChange={(e) => setCustomEventData(e.target.value)}
                  placeholder='{"key": "value"}'
                  rows="3"
                ></textarea>
              </div>
              <button 
                type="submit" 
                className="btn btn-success" 
                disabled={!sse.connected}
              >
                Send Event
              </button>
            </form>

            <hr />

            <h6>Broadcast to All Clients</h6>
            <form onSubmit={handleBroadcast}>
              <div className="mb-3">
                <label className="form-label">Data (JSON)</label>
                <textarea
                  className="form-control"
                  value={broadcastData}
                  onChange={(e) => setBroadcastData(e.target.value)}
                  placeholder='{"message": "Hello everyone!"}'
                  rows="3"
                ></textarea>
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={!sse.connected}
              >
                Broadcast
              </button>
            </form>

            <hr />

            <h6>Connected Clients</h6>
            <div className="list-group" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {connectedClients.length === 0 ? (
                <p className="text-muted">No clients connected</p>
              ) : (
                connectedClients.map((client, index) => (
                  <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                    <span className="text-truncate" style={{ maxWidth: '70%' }}>{client}</span>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => {
                        sse.closeConnection(client)
                          .then(response => {
                            console.log('Client disconnected:', response);
                            fetchConnectedClients();
                          })
                          .catch(err => console.error('Error disconnecting client:', err));
                      }}
                    >
                      Disconnect
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventsContainer;
