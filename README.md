# Server-Sent Events (SSE) Demo

This project demonstrates real-time communication between a Spring Boot backend and a React frontend using Server-Sent Events (SSE).

## Project Structure

- `/backend` - Spring Boot WebFlux backend with SSE endpoints
- `/frontend` - React frontend with SSE client library

## Key Features

- Real-time server-to-client updates using SSE
- Bidirectional communication (client-to-server via REST)
- Client connection management
- Event broadcasting to all connected clients
- Customizable event types and payloads
- Automatic reconnection on errors

## Backend

The Spring Boot backend provides the following functionalities:

- SSE endpoint for establishing connections
- Connection management with unique client IDs
- Sending events to specific clients
- Broadcasting events to all connected clients
- Connection status monitoring

### API Endpoints

- `GET /api/sse/connect` - Establish SSE connection
- `GET /api/sse/clients` - List all connected clients
- `GET /api/sse/clients/{clientId}` - Check if a client is connected
- `POST /api/sse/send/{clientId}` - Send event to a specific client
- `POST /api/sse/broadcast` - Broadcast event to all clients
- `DELETE /api/sse/close/{clientId}` - Close a specific client connection
- `DELETE /api/sse/close-all` - Close all client connections

## Frontend

The React frontend includes:

- A reusable SSE client library (`SSEClient.js`)
- UI for managing SSE connections
- Event display and filtering
- Controls for sending events to specific clients
- Broadcasting capability

### SSE Client Library

The client library (`frontend/src/lib/SSEClient.js`) provides:

- A custom React hook for SSE integration
- Connection management
- Event handling with support for custom event types
- Error handling and automatic reconnection

## Running the Application

### Backend

```bash
cd backend
mvn spring-boot:run
```

The backend will start on port 8000.

### Frontend

```bash
cd frontend
npm install
npm start
```

The frontend will start on port 5000.

## Technologies Used

- **Backend**: Spring Boot 2.7.8, Spring WebFlux, Project Reactor
- **Frontend**: React 18.2.0, EventSource API
- **Styling**: Bootstrap 5

## Building for Production

### Backend

```bash
cd backend
mvn clean package
```

This will create a JAR file in the `target` directory.

### Frontend

```bash
cd frontend
npm run build
```

This will create a production build in the `build` directory.