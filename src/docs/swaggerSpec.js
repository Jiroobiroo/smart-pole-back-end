/**
 * OpenAPI 3.0.0 Specification for Smart Pole Monitoring and Control API
 * Compatible with Swagger UI and swagger.io / editor.swagger.io
 */

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Smart Pole Monitoring & Control System API',
    version: '1.0.0',
    description: `
**Smart Pole IoT Central Management System**
This REST API allows operators to remotely monitor and control smart pole streetlight functionalities, display messages on the pole's LCD, record sensor telemetry, compute real-time power consumption, detect faults, and view historical events.

### Core Modules
1. **Lamp Control**: Remotely switch streetlight ON/OFF, toggle state, and adjust brightness.
2. **LCD Display**: Send text or individual letters to the pole's 16x2 screen, manage backlight, and clear screen.
3. **Telemetry & Electrical Monitoring**: Ingest temperature, voltage, and current readings, automatically calculate power ($P = V \\times I$), track energy consumption, and trigger alerts on abnormal readings.
4. **Audit History & Alerts**: Track every command and anomaly with timestamps.
    `,
    contact: {
      name: 'Smart Pole Engineering Team'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server'
    }
  ],
  tags: [
    {
      name: 'Lamp Control',
      description: 'Endpoints for controlling and monitoring the smart pole streetlight'
    },
    {
      name: 'LCD Display',
      description: 'Endpoints for sending text and characters to the pole LCD'
    },
    {
      name: 'Telemetry & Power',
      description: 'Endpoints for sensor data ingestion, electrical power calculations, and fault alerts'
    },
    {
      name: 'System',
      description: 'System health and diagnostics'
    }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Check API Server Health',
        description: 'Returns operational status and timestamp of the Smart Pole Backend API.',
        responses: {
          '200': {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' }
              }
            }
          }
        }
      }
    },
    // --- LAMP CONTROL ---
    '/api/v1/lamp': {
      get: {
        tags: ['Lamp Control'],
        summary: 'Get Current Lamp Status',
        description: 'Retrieves live status (ON/OFF, brightness %, mode, last updated).',
        responses: {
          '200': {
            description: 'Current lamp status',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LampStatusResponse' }
              }
            }
          }
        }
      }
    },
    '/api/v1/lamp/state': {
      post: {
        tags: ['Lamp Control'],
        summary: 'Set Lamp State (ON / OFF)',
        description: 'Remotely switches the streetlight ON or OFF.',
        parameters: [
          {
            name: 'x-client-id',
            in: 'header',
            schema: { type: 'string', example: 'Central-Dashboard' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LampStateRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Lamp state successfully changed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LampActionResponse' }
              }
            }
          },
          '400': {
            description: 'Invalid input payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/v1/lamp/toggle': {
      post: {
        tags: ['Lamp Control'],
        summary: 'Toggle Lamp ON / OFF',
        description: 'Inverts current state of the streetlight.',
        responses: {
          '200': {
            description: 'Lamp toggled successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LampActionResponse' }
              }
            }
          }
        }
      }
    },
    '/api/v1/lamp/dimming': {
      post: {
        tags: ['Lamp Control'],
        summary: 'Adjust Lamp Brightness',
        description: 'Sets brightness level between 0% and 100%.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LampDimmingRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Brightness adjusted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LampActionResponse' }
              }
            }
          },
          '400': {
            description: 'Invalid brightness',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/v1/lamp/history': {
      get: {
        tags: ['Lamp Control'],
        summary: 'Get Lamp Event History',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 }
          }
        ],
        responses: {
          '200': {
            description: 'Recent lamp events',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LampHistoryResponse' }
              }
            }
          }
        }
      }
    },
    // --- LCD DISPLAY ---
    '/api/v1/lcd': {
      get: {
        tags: ['LCD Display'],
        summary: 'Get Current LCD Screen Text',
        description: 'Retrieves current lines, backlight status, and last update timestamp.',
        responses: {
          '200': {
            description: 'Current LCD status',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LcdStatusResponse' }
              }
            }
          }
        }
      }
    },
    '/api/v1/lcd/message': {
      post: {
        tags: ['LCD Display'],
        summary: 'Set LCD Text Message',
        description: 'Updates text on line 1, line 2, or both lines.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LcdMessageRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'LCD text updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LcdActionResponse' }
              }
            }
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/v1/lcd/char': {
      post: {
        tags: ['LCD Display'],
        summary: 'Send Single Character / Letter to LCD',
        description: 'Appends a single letter to the designated line (fulfills mandatory requirement: "including individual letters or text").',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LcdCharRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Character appended',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LcdActionResponse' }
              }
            }
          }
        }
      }
    },
    '/api/v1/lcd/clear': {
      post: {
        tags: ['LCD Display'],
        summary: 'Clear LCD Screen',
        description: 'Wipes both lines on the display.',
        responses: {
          '200': {
            description: 'Screen cleared',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LcdActionResponse' }
              }
            }
          }
        }
      }
    },
    '/api/v1/lcd/backlight': {
      post: {
        tags: ['LCD Display'],
        summary: 'Toggle or Set LCD Backlight',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { backlight: { type: 'boolean', example: true } }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Backlight updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LcdActionResponse' }
              }
            }
          }
        }
      }
    },
    '/api/v1/lcd/history': {
      get: {
        tags: ['LCD Display'],
        summary: 'Get LCD Message History',
        responses: {
          '200': {
            description: 'Recent message updates',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LcdHistoryResponse' }
              }
            }
          }
        }
      }
    },
    // --- TELEMETRY & POWER ---
    '/api/v1/telemetry': {
      post: {
        tags: ['Telemetry & Power'],
        summary: 'Submit Sensor Readings (Telemetry Ingestion)',
        description: 'Ingests measured temperature, voltage, and current from the pole controller. Automatically computes power ($P = V \\times I$), calculates accumulated energy, and checks for threshold alerts.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TelemetryIngestRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Telemetry successfully processed and stored',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TelemetryResponse' }
              }
            }
          },
          '400': {
            description: 'Invalid sensor measurements',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/v1/telemetry/latest': {
      get: {
        tags: ['Telemetry & Power'],
        summary: 'Get Latest Sensor Readings & Computed Power',
        description: 'Returns real-time voltage, current, calculated power (Watts), energy (Wh), enclosure temperature, and active fault alerts.',
        responses: {
          '200': {
            description: 'Latest telemetry data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TelemetryResponse' }
              }
            }
          }
        }
      }
    },
    '/api/v1/telemetry/history': {
      get: {
        tags: ['Telemetry & Power'],
        summary: 'Get Historical Telemetry Readings',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 }
          }
        ],
        responses: {
          '200': {
            description: 'Telemetry history list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TelemetryHistoryResponse' }
              }
            }
          }
        }
      }
    },
    '/api/v1/telemetry/alerts': {
      get: {
        tags: ['Telemetry & Power'],
        summary: 'Get Active Fault Detection Alerts',
        description: 'Lists any active alerts (e.g. over-temperature, overvoltage, undervoltage, or overcurrent).',
        responses: {
          '200': {
            description: 'Active alert list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AlertsResponse' }
              }
            }
          }
        }
      }
    },
    '/api/v1/telemetry/alerts/clear': {
      post: {
        tags: ['Telemetry & Power'],
        summary: 'Clear Active Alerts',
        responses: {
          '200': {
            description: 'Alerts cleared',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TelemetryResponse' }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'healthy' },
          timestamp: { type: 'string', format: 'date-time' },
          service: { type: 'string', example: 'Smart Pole Backend API' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Invalid parameter' }
        }
      },
      // Lamp schemas
      LampStateRequest: {
        type: 'object',
        required: ['state'],
        properties: {
          state: { type: 'string', enum: ['ON', 'OFF'], example: 'ON' }
        }
      },
      LampDimmingRequest: {
        type: 'object',
        required: ['brightness'],
        properties: {
          brightness: { type: 'integer', minimum: 0, maximum: 100, example: 75 }
        }
      },
      LampStatusData: {
        type: 'object',
        properties: {
          poleId: { type: 'string', example: 'POLE-001' },
          status: { type: 'string', enum: ['ON', 'OFF'], example: 'ON' },
          brightness: { type: 'integer', example: 100 },
          mode: { type: 'string', example: 'MANUAL' },
          lastUpdated: { type: 'string', format: 'date-time' }
        }
      },
      LampStatusResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { $ref: '#/components/schemas/LampStatusData' }
        }
      },
      LampActionResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Lamp successfully turned ON' },
          data: { $ref: '#/components/schemas/LampStatusData' }
        }
      },
      LampHistoryResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          count: { type: 'integer', example: 2 },
          data: { type: 'array', items: { type: 'object' } }
        }
      },
      // LCD schemas
      LcdMessageRequest: {
        type: 'object',
        properties: {
          line1: { type: 'string', maxLength: 16, example: 'CAUTION ROADWORK' },
          line2: { type: 'string', maxLength: 16, example: 'SPEED LIMIT 30' },
          message: { type: 'string', example: 'HELLO WORLD' }
        }
      },
      LcdCharRequest: {
        type: 'object',
        required: ['char'],
        properties: {
          char: { type: 'string', maxLength: 1, example: 'A' },
          line: { type: 'integer', enum: [1, 2], default: 1, example: 1 }
        }
      },
      LcdStatusData: {
        type: 'object',
        properties: {
          poleId: { type: 'string', example: 'POLE-001' },
          line1: { type: 'string', example: 'SMART POLE SYS' },
          line2: { type: 'string', example: 'SYSTEM READY' },
          backlight: { type: 'boolean', example: true },
          lastUpdated: { type: 'string', format: 'date-time' }
        }
      },
      LcdStatusResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { $ref: '#/components/schemas/LcdStatusData' }
        }
      },
      LcdActionResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'LCD text updated successfully' },
          data: { $ref: '#/components/schemas/LcdStatusData' }
        }
      },
      LcdHistoryResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          count: { type: 'integer', example: 1 },
          data: { type: 'array', items: { type: 'object' } }
        }
      },
      // Telemetry schemas
      TelemetryIngestRequest: {
        type: 'object',
        required: ['temperature', 'voltage', 'current'],
        properties: {
          temperature: { type: 'number', description: 'Enclosure temperature in Celsius', example: 26.4 },
          voltage: { type: 'number', description: 'Monitored voltage in Volts', example: 228.5 },
          current: { type: 'number', description: 'Monitored current in Amperes', example: 0.52 }
        }
      },
      TelemetryData: {
        type: 'object',
        properties: {
          poleId: { type: 'string', example: 'POLE-001' },
          temperature: { type: 'number', example: 26.4 },
          voltage: { type: 'number', example: 228.5 },
          current: { type: 'number', example: 0.52 },
          power: { type: 'number', description: 'Calculated Power P = V * I in Watts', example: 118.82 },
          energyWh: { type: 'number', description: 'Accumulated energy in Watt-hours', example: 14.5 },
          systemStatus: { type: 'string', enum: ['NORMAL', 'WARNING', 'CRITICAL'], example: 'NORMAL' },
          alerts: { type: 'array', items: { type: 'string' }, example: [] },
          lastUpdated: { type: 'string', format: 'date-time' }
        }
      },
      TelemetryResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { $ref: '#/components/schemas/TelemetryData' }
        }
      },
      TelemetryHistoryResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          count: { type: 'integer', example: 5 },
          data: { type: 'array', items: { $ref: '#/components/schemas/TelemetryData' } }
        }
      },
      AlertsResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              poleId: { type: 'string', example: 'POLE-001' },
              status: { type: 'string', example: 'NORMAL' },
              alerts: { type: 'array', items: { type: 'string' } },
              lastChecked: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  }
};

module.exports = swaggerSpec;
