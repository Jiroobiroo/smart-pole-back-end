# Smart Pole Monitoring & Control System — Lamp Control API

Backend REST API for controlling and monitoring the smart pole streetlight, built with **Node.js** and **Express.js** following professional software engineering standards.

---

## 1. System Architecture

```text
[ Central Web Dashboard ]       [ Embedded Pole Controller ]
     (HTML / React)                (ESP32 / Proteus Simulation)
            │                                     │
            │ HTTP (POST /api/v1/lamp/state)      │ HTTP Poll (GET /api/v1/lamp)
            ▼                                     ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │                   Central Backend System                        │
 │                                                                 │
 │   Routes:       src/routes/lampRoutes.js                        │
 │   Middleware:   src/middleware/validator.js & logger.js         │
 │   Controller:   src/controllers/lampController.js               │
 │   Service:      src/services/lampService.js (State & History)   │
 └─────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```text
lamp-control-api/
├── firmware_examples/
│   └── esp32_lamp_controller.ino     # Sample ESP32 / Proteus firmware
├── public/
│   └── index.html                    # Interactive test dashboard
├── src/
│   ├── config/
│   │   └── index.js                  # Environment & config loader
│   ├── controllers/
│   │   └── lampController.js         # Request/response orchestration
│   ├── middleware/
│   │   ├── errorHandler.js           # Centralized 404 & 500 error handlers
│   │   ├── logger.js                 # Structured request and event logging
│   │   └── validator.js              # Command payload validation
│   ├── routes/
│   │   └── lampRoutes.js             # Route definitions
│   ├── services/
│   │   └── lampService.js            # Business logic and state management
│   ├── app.js                        # Express application assembly
│   └── server.js                     # Server entrypoint and graceful shutdown
├── test/
│   ├── lamp.test.js                  # API integration tests
│   └── lampService.test.js           # Isolated unit tests
├── .env                              # Active environment variables
├── .env.example                      # Template environment variables
├── package.json
└── README.md
```

---

## 3. Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (verified on v24.15.0)
- npm v9+

### Installation
Clone or navigate to the directory and install dependencies:
```bash
npm install
```

### Configuration
Review or adjust `.env`:
```env
PORT=5000
NODE_ENV=development
POLE_ID=POLE-001
DEFAULT_LAMP_STATE=OFF
DEFAULT_BRIGHTNESS=100
```

### Running the Server
- **Production mode**:
  ```bash
  npm start
  ```
- **Development mode** (auto-reloads on file change):
  ```bash
  npm run dev
  ```

### Running Tests
Execute unit and integration tests using Node's native test runner:
```bash
npm test
```
Or run the unit tests directly:
```bash
node --test test/lampService.test.js
```

### Quick Interactive Dashboard
Open your browser at:
```text
http://localhost:5000/
```
From here you can visually switch the lamp ON/OFF, toggle, adjust brightness, and watch event history update live.

---

## 4. API Documentation

### Base URL
`http://localhost:5000/api/v1/lamp`

---

### `GET /api/v1/lamp`
Returns the current status of the smart pole lamp.

**Request:**
```http
GET /api/v1/lamp HTTP/1.1
Host: localhost:5000
```

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "poleId": "POLE-001",
    "status": "OFF",
    "brightness": 100,
    "mode": "MANUAL",
    "lastUpdated": "2026-11-11T07:30:00.000Z"
  }
}
```

---

### `POST /api/v1/lamp/state`
Sets the lamp state directly to `ON` or `OFF`.

**Request:**
```http
POST /api/v1/lamp/state HTTP/1.1
Host: localhost:5000
Content-Type: application/json
x-client-id: Central-Dashboard

{
  "state": "ON"
}
```

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Lamp successfully turned ON",
  "data": {
    "poleId": "POLE-001",
    "status": "ON",
    "brightness": 100,
    "mode": "MANUAL",
    "lastUpdated": "2026-11-11T07:31:00.000Z"
  }
}
```

**Validation Error Response (`400 Bad Request`):**
```json
{
  "success": false,
  "error": "Invalid lamp state: \"HALF_ON\". State must be either \"ON\" or \"OFF\"."
}
```

---

### `POST /api/v1/lamp/toggle`
Inverts the current state (`ON` $\leftrightarrow$ `OFF`).

**Request:**
```http
POST /api/v1/lamp/toggle HTTP/1.1
Host: localhost:5000
```

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Lamp successfully toggled to ON",
  "data": {
    "poleId": "POLE-001",
    "status": "ON",
    "brightness": 100,
    "mode": "MANUAL",
    "lastUpdated": "2026-11-11T07:32:00.000Z"
  }
}
```

---

### `POST /api/v1/lamp/dimming`
Adjusts lamp brightness from 0 to 100%.

**Request:**
```http
POST /api/v1/lamp/dimming HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "brightness": 75
}
```

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Lamp brightness set to 75%",
  "data": {
    "poleId": "POLE-001",
    "status": "ON",
    "brightness": 75,
    "mode": "MANUAL",
    "lastUpdated": "2026-11-11T07:33:00.000Z"
  }
}
```

---

### `GET /api/v1/lamp/history`
Returns a list of recent lamp switching and dimming events.

**Query Parameters:**
- `limit` *(optional, integer)*: Maximum number of events to return (default: `20`, max: `50`).

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 2,
      "type": "STATE_CHANGE",
      "previousState": "OFF",
      "newState": "ON",
      "brightness": 100,
      "source": "REST_API",
      "timestamp": "2026-11-11T07:31:00.000Z"
    },
    {
      "id": 1,
      "type": "STATE_CHANGE",
      "previousState": "ON",
      "newState": "OFF",
      "brightness": 100,
      "source": "DASHBOARD_UI",
      "timestamp": "2026-11-11T07:30:00.000Z"
    }
  ]
}
```

---

## 5. cURL Quick Test Commands

```bash
# 1. Check health
curl http://localhost:5000/health

# 2. Get current lamp status
curl http://localhost:5000/api/v1/lamp

# 3. Turn lamp ON
curl -X POST http://localhost:5000/api/v1/lamp/state \
  -H "Content-Type: application/json" \
  -d "{\"state\":\"ON\"}"

# 4. Turn lamp OFF
curl -X POST http://localhost:5000/api/v1/lamp/state \
  -H "Content-Type: application/json" \
  -d "{\"state\":\"OFF\"}"

# 5. Toggle lamp
curl -X POST http://localhost:5000/api/v1/lamp/toggle

# 6. Adjust dimming
curl -X POST http://localhost:5000/api/v1/lamp/dimming \
  -H "Content-Type: application/json" \
  -d "{\"brightness\":60}"

# 7. View command history
curl http://localhost:5000/api/v1/lamp/history?limit=5
```

---

## 6. Embedded Controller Integration (Simulation / ESP32)

See [`firmware_examples/esp32_lamp_controller.ino`](file:///c:/Users/DELL/OneDrive/Desktop/lamp%20control%20api/firmware_examples/esp32_lamp_controller.ino) for the Arduino C++ firmware that:
1. Connects to the local network.
2. Polls `GET http://<backend-ip>:5000/api/v1/lamp` every 2 seconds.
3. Deserializes the JSON payload.
4. Drives the relay GPIO pin `HIGH` or `LOW` accordingly.
