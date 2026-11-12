# Smart Pole Monitoring and Control System
## Comprehensive Backend Technical Documentation & API Specification

---

## 1. System Overview & Architecture

The **Smart Pole Central Backend System** serves as the primary intelligence, control, and data acquisition engine for the smart pole IoT infrastructure. It bridges the **Central Web Dashboard** (operator controls) and the **Pole-Side Embedded Controller** (hardware sensors, LCD display, and streetlight relay).

### 1.1 Architecture Diagram

```
 +-------------------------------------------------------------------------+
 |                         Central Web Dashboard                           |
 |                (Operator UI / LCD Manager / Telemetry)                  |
 +-------------------------------------------------------------------------+
                                    ▲
                                    │ HTTP / REST (JSON)
                                    ▼
 +-------------------------------------------------------------------------+
 |                         CENTRAL BACKEND API                             |
 |                                                                         |
 |  [ Routing Layer ]                                                      |
 |    ├── /api/v1/lamp        (Streetlight switching, dimming, toggle)     |
 |    ├── /api/v1/lcd         (16x2 text messages, single char streaming)  |
 |    ├── /api/v1/telemetry   (Sensor ingestion, power P = V * I, alerts)  |
 |    ├── /api/v1/database    (Live SQL table inspector)                   |
 |    └── /api-docs           (OpenAPI 3.0 / Swagger UI)                   |
 |                                                                         |
 |  [ Middleware Layer ]                                                   |
 |    ├── CORS & express.json() Body Parser                                |
 |    ├── Structured Request Logger                                        |
 |    ├── Payload Validators (bounds, types, line limits)                  |
 |    └── Centralized Error & 404 Handlers                                 |
 |                                                                         |
 |  [ Service & Business Logic Layer ]                                     |
 |    ├── LampService        (state transitions, bounds checking)          |
 |    ├── LcdService         (character buffer, scrolling, backlight)      |
 |    └── TelemetryService   (electrical calculations, fault detection)    |
 |                                                                         |
 |  [ Persistence Layer ]                                                  |
 |    └── SQLite Database (data/smartpole.db with WAL mode)                |
 +-------------------------------------------------------------------------+
                                    ▲
                                    │ HTTP Poll & Ingest
                                    ▼
 +-------------------------------------------------------------------------+
 |                     Pole Controller (ESP32 / Proteus)                   |
 |   ├── Streetlight Relay / Dimmer PWM                                    |
 |   ├── HD44780 16x2 I2C LCD Display                                      |
 |   ├── Temperature Sensor (DHT22 / LM35)                                 |
 |   └── Electrical Sensors (Voltage divider, ACS712 Current Sensor)       |
 +-------------------------------------------------------------------------+
```

---

## 2. Database Architecture (SQLite Schema)

The backend uses a local, zero-configuration relational **SQLite database** stored at `data/smartpole.db`. It runs with Write-Ahead Logging (`WAL` mode) and busy timeouts to ensure robust concurrency.

### 2.1 Table Schemas

#### 1. `lamp_status` (Current Streetlight State)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `pole_id` | TEXT | PRIMARY KEY | Unique pole identifier (e.g. `POLE-001`) |
| `status` | TEXT | NOT NULL | Operational state (`ON` or `OFF`) |
| `brightness` | INTEGER | DEFAULT 100 | Brightness percentage ($0 - 100$) |
| `mode` | TEXT | DEFAULT 'MANUAL' | Control mode (`MANUAL` or `AUTO`) |
| `last_updated` | TEXT | NOT NULL | ISO-8601 UTC timestamp |

#### 2. `lamp_logs` (Streetlight Command Audit Trail)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique log entry ID |
| `pole_id` | TEXT | NOT NULL | Target pole ID |
| `action` | TEXT | NOT NULL | Action type (`STATE_CHANGE`, `BRIGHTNESS_CHANGE`) |
| `previous_state` | TEXT | NULLABLE | State prior to execution |
| `new_state` | TEXT | NULLABLE | Resulting state |
| `brightness` | INTEGER | NULLABLE | Resulting brightness |
| `source` | TEXT | NOT NULL | Origin of command (`REST_API`, `DASHBOARD_UI`) |
| `timestamp` | TEXT | NOT NULL | Execution timestamp |

#### 3. `lcd_status` (Current LCD Screen Buffer)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `pole_id` | TEXT | PRIMARY KEY | Unique pole ID |
| `line1` | TEXT | DEFAULT '' | Top line buffer (max 16 characters) |
| `line2` | TEXT | DEFAULT '' | Bottom line buffer (max 16 characters) |
| `backlight` | INTEGER | DEFAULT 1 | Backlight state ($1 = \text{ON}, 0 = \text{OFF}$) |
| `last_updated` | TEXT | NOT NULL | ISO-8601 UTC timestamp |

#### 4. `lcd_logs` (LCD Message Audit Trail)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique log entry ID |
| `pole_id` | TEXT | NOT NULL | Target pole ID |
| `action` | TEXT | NOT NULL | Action (`TEXT_UPDATE`, `CHAR_APPENDED`, `CLEARED`, `BACKLIGHT_CHANGE`) |
| `line1` | TEXT | NULLABLE | Line 1 snapshot |
| `line2` | TEXT | NULLABLE | Line 2 snapshot |
| `char_sent` | TEXT | NULLABLE | Individual character sent (if character streaming) |
| `source` | TEXT | NOT NULL | Command source |
| `timestamp` | TEXT | NOT NULL | Execution timestamp |

#### 5. `telemetry_logs` (Sensor Historical Measurements)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Telemetry reading ID |
| `pole_id` | TEXT | NOT NULL | Originating pole ID |
| `temperature` | REAL | NOT NULL | Enclosure temperature in $^{\circ}\text{C}$ |
| `voltage` | REAL | NOT NULL | Measured line voltage in Volts |
| `current` | REAL | NOT NULL | Measured electrical current in Amperes |
| `power` | REAL | NOT NULL | Calculated Power in Watts ($P = V \times I$) |
| `system_status` | TEXT | NOT NULL | Health flag (`NORMAL`, `WARNING`, `CRITICAL`) |
| `timestamp` | TEXT | NOT NULL | Ingestion timestamp |

---

## 3. Complete REST API Specification

### Base URL
```text
http://<server-ip>:5000/api/v1
```

---

### 3.1 Lamp Control Module (`/api/v1/lamp`)

#### 1. `GET /api/v1/lamp`
*Retrieves current operational status of the streetlight.*
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "poleId": "POLE-001",
      "status": "ON",
      "brightness": 100,
      "mode": "MANUAL",
      "lastUpdated": "2026-11-11T12:00:00.000Z"
    }
  }
  ```

#### 2. `POST /api/v1/lamp/state`
*Switches the lamp ON or OFF.*
- **Headers**: `Content-Type: application/json`, `x-client-id: <client-name>`
- **Request Body**:
  ```json
  {
    "state": "ON"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Lamp successfully turned ON",
    "data": {
      "poleId": "POLE-001",
      "status": "ON",
      "brightness": 100,
      "mode": "MANUAL",
      "lastUpdated": "2026-11-11T12:01:00.000Z"
    }
  }
  ```
- **Error `400 Bad Request`**:
  ```json
  {
    "success": false,
    "error": "Invalid lamp state: \"INVALID\". State must be either \"ON\" or \"OFF\"."
  }
  ```

#### 3. `POST /api/v1/lamp/toggle`
*Inverts current state (`ON` $\leftrightarrow$ `OFF`).*
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Lamp successfully toggled to OFF",
    "data": {
      "poleId": "POLE-001",
      "status": "OFF",
      "brightness": 100,
      "mode": "MANUAL",
      "lastUpdated": "2026-11-11T12:02:00.000Z"
    }
  }
  ```

#### 4. `POST /api/v1/lamp/dimming`
*Sets brightness level between 0% and 100%.*
- **Request Body**:
  ```json
  {
    "brightness": 70
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Lamp brightness set to 70%",
    "data": {
      "poleId": "POLE-001",
      "status": "ON",
      "brightness": 70,
      "mode": "MANUAL",
      "lastUpdated": "2026-11-11T12:03:00.000Z"
    }
  }
  ```

#### 5. `GET /api/v1/lamp/history`
*Retrieves recent switching and dimming events.*
- **Query Parameter**: `limit` (default: 20, max: 50)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "id": 1,
        "type": "STATE_CHANGE",
        "previousState": "OFF",
        "newState": "ON",
        "brightness": 100,
        "source": "REST_API",
        "timestamp": "2026-11-11T12:01:00.000Z"
      }
    ]
  }
  ```

---

### 3.2 LCD Display Module (`/api/v1/lcd`)

#### 1. `GET /api/v1/lcd`
*Retrieves current screen lines and backlight status.*
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "poleId": "POLE-001",
      "line1": "SMART POLE SYS",
      "line2": "SYSTEM READY",
      "fullText": "SMART POLE SYS\nSYSTEM READY",
      "backlight": true,
      "maxCharsPerLine": 16,
      "lastUpdated": "2026-11-11T12:00:00.000Z"
    }
  }
  ```

#### 2. `POST /api/v1/lcd/message`
*Sets text on Line 1, Line 2, or both.*
- **Request Body**:
  ```json
  {
    "line1": "CAUTION ROADWORK",
    "line2": "SPEED LIMIT 30"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "LCD text updated successfully",
    "data": {
      "poleId": "POLE-001",
      "line1": "CAUTION ROADWORK",
      "line2": "SPEED LIMIT 30",
      "backlight": true,
      "lastUpdated": "2026-11-11T12:05:00.000Z"
    }
  }
  ```

#### 3. `POST /api/v1/lcd/char`
*Sends an individual character or letter to designated line.*
*(Fulfills requirement: "including individual letters or text")*
- **Request Body**:
  ```json
  {
    "char": "!",
    "line": 2
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Appended character '!' to line 2",
    "data": {
      "poleId": "POLE-001",
      "line1": "CAUTION ROADWORK",
      "line2": "SPEED LIMIT 30!",
      "backlight": true,
      "lastUpdated": "2026-11-11T12:06:00.000Z"
    }
  }
  ```

#### 4. `POST /api/v1/lcd/clear`
*Clears both lines on the screen.*
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "LCD screen cleared",
    "data": {
      "poleId": "POLE-001",
      "line1": "",
      "line2": "",
      "backlight": true,
      "lastUpdated": "2026-11-11T12:07:00.000Z"
    }
  }
  ```

#### 5. `POST /api/v1/lcd/backlight`
*Toggles or sets the LCD backlight state.*
- **Request Body** *(optional)*: `{"backlight": false}`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "LCD backlight set to false",
    "data": {
      "poleId": "POLE-001",
      "backlight": false,
      "lastUpdated": "2026-11-11T12:08:00.000Z"
    }
  }
  ```

---

### 3.3 Telemetry & Electrical Power Module (`/api/v1/telemetry`)

#### 1. `POST /api/v1/telemetry`
*Ingests sensor readings, calculates electrical power ($P = V \times I$), and detects fault thresholds.*
- **Request Body**:
  ```json
  {
    "temperature": 26.4,
    "voltage": 228.5,
    "current": 0.52
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "message": "Telemetry readings processed successfully",
    "data": {
      "poleId": "POLE-001",
      "temperature": 26.4,
      "voltage": 228.5,
      "current": 0.52,
      "power": 118.82,
      "energyWh": 14.5,
      "systemStatus": "NORMAL",
      "alerts": [],
      "lastUpdated": "2026-11-11T12:10:00.000Z"
    }
  }
  ```

#### 2. `GET /api/v1/telemetry/latest`
*Returns current real-time readings, power, and active alerts.*
- **Response `200 OK`**: Returns current `TelemetryData` object.

#### 3. `GET /api/v1/telemetry/alerts`
*Lists active fault alerts (over-temperature, overvoltage, undervoltage, or overcurrent).*
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "poleId": "POLE-001",
      "status": "WARNING",
      "alerts": [
        "High Temperature Alert: 63°C exceeds threshold of 60°C"
      ],
      "lastChecked": "2026-11-11T12:12:00.000Z"
    }
  }
  ```

---

### 3.4 Database & Diagnostics

#### 1. `GET /api/v1/database/viewer`
*Inspects all raw rows from SQLite tables for real-time verification.*
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "database": "smartpole.db (SQLite)",
    "tables": {
      "lamp_status": { "count": 1, "rows": [...] },
      "lamp_logs": { "count": 12, "rows": [...] },
      "lcd_status": { "count": 1, "rows": [...] },
      "lcd_logs": { "count": 8, "rows": [...] }
    }
  }
  ```

#### 2. `GET /health`
*System health probe.*
- **Response `200 OK`**: `{"status": "healthy", "service": "Smart Pole Backend API"}`

---

## 4. Software Engineering & Standards

- **Separation of Concerns**: Controllers handle HTTP logic, Services encapsulate business rules and calculations, Database layer isolates SQL operations, and Middleware enforces contracts.
- **Input Validation**: Rejects invalid states (`400 Bad Request`), restricts LCD strings to 16 characters per line, and validates electrical sensor ranges.
- **Structured Logging**: All operations output standardized timestamped logs with severity levels (`[INFO]`, `[WARN]`, `[ERROR]`).
- **Automated Tests**: Tested using Node's native test runner (`node --test`), covering unit logic and end-to-end HTTP integration (24/24 tests pass).

---

## 5. Execution & Verification

### Running the Server
```bash
npm start
```

### Running Automated Tests
```bash
npm test
```

### Interactive Documentation
- **Swagger Documentation**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- **Raw OpenAPI Spec**: [http://localhost:5000/api-docs.json](http://localhost:5000/api-docs.json)

