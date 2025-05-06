import React, { useState, useEffect } from 'react';
import EventsContainer from './components/EventsContainer';

// Helper function to determine the appropriate backend URL
const getDefaultBackendUrl = () => {
  const hostname = window.location.hostname;
  
  // For Replit, use special handling
  if (hostname.includes('.replit.dev') || hostname.includes('.repl.co')) {
    // We need to use the same hostname but different port
    return `https://${hostname.replace('5000', '8000')}`;
  }
  
  // For localhost/development
  return `http://${hostname}:8000`;
};

function App() {
  const [serverUrl, setServerUrl] = useState('');
  const [backendUrl, setBackendUrl] = useState('');
  
  useEffect(() => {
    const url = getDefaultBackendUrl();
    console.log('Using backend URL:', url);
    setBackendUrl(url);
    
    // Test connection
    fetch(`${url}/api/sse/clients`)
      .then(res => res.json())
      .then(data => {
        console.log('Successfully connected to backend:', data);
      })
      .catch(err => {
        console.error('Failed to connect to backend:', err);
      });
  }, []);
  
  return (
    <div className="container py-4">
      <header className="pb-3 mb-4 border-bottom">
        <h1 className="display-5 fw-bold">SSE Client Demo</h1>
        <p className="lead">A demonstration of Server-Sent Events with Spring Boot and React</p>
      </header>

      <div className="mb-4">
        <div className="input-group">
          <span className="input-group-text">Server URL (Optional)</span>
          <input 
            type="text" 
            className="form-control" 
            value={serverUrl} 
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder={backendUrl || "Auto-detected backend URL"}
          />
        </div>
        <div className="form-text">
          {backendUrl ? 
            `Using backend at: ${backendUrl}` : 
            "Detecting backend URL..."}
        </div>
      </div>

      <EventsContainer serverUrl={serverUrl || backendUrl} />

      <footer className="pt-3 mt-4 text-muted border-top">
        <p>SSE Client Library Demo &copy; 2023</p>
      </footer>
    </div>
  );
}

export default App;
