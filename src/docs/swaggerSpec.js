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
This REST API allows operators to remotely monitor and control smart pole streetlight functionalities, view live device status, and track historical events.

### Features
- **Lamp ON/OFF Control**: Switch the streetlight remotely.
- **Light Dimming**: Adjust lamp brightness ($0 - 100\\%$).
- **Toggle Control**: Invert lamp state with a single call.
- **Event History**: Audit trail of commands and status changes.
- **Health Check**: Server health probe.
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
      name: 'System',
      description: 'System health and diagnostics'
    }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Check API Server Health',
        description: 'Returns the operational status and timestamp of the Smart Pole Backend API.',
        responses: {
          '200': {
            description: 'API is healthy and operational',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse'
                }
              }
            }
          }
        }
      }
    },
    '/api/v1/lamp': {
      get: {
        tags: ['Lamp Control'],
        summary: 'Get Current Lamp Status',
        description: 'Retrieves the live operational status of the streetlight (ON/OFF state, brightness percentage, mode, and last update timestamp).',
        responses: {
          '200': {
            description: 'Current lamp status successfully retrieved',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LampStatusResponse'
                }
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
            required: false,
            description: 'Optional identifier for the command source (e.g. Dashboard, MobileApp, Scheduler)',
            schema: {
              type: 'string',
              example: 'Central-Dashboard'
            }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LampStateRequest'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Lamp state successfully changed',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LampActionResponse'
                }
              }
            }
          },
          '400': {
            description: 'Invalid input payload (e.g. missing or invalid state value)',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
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
        description: 'Inverts the current state of the streetlight (switches ON to OFF, or OFF to ON).',
        parameters: [
          {
            name: 'x-client-id',
            in: 'header',
            required: false,
            description: 'Optional source client identifier',
            schema: {
              type: 'string',
              example: 'Operator-Console'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Lamp state successfully toggled',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LampActionResponse'
                }
              }
            }
          }
        }
      }
    },
    '/api/v1/lamp/dimming': {
      post: {
        tags: ['Lamp Control'],
        summary: 'Adjust Lamp Brightness (Dimming)',
        description: 'Sets the streetlight brightness level between 0% and 100%. Setting brightness > 0 turns the lamp ON automatically; setting 0% turns the lamp OFF.',
        parameters: [
          {
            name: 'x-client-id',
            in: 'header',
            required: false,
            schema: {
              type: 'string',
              example: 'Central-Dashboard'
            }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LampDimmingRequest'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Lamp brightness successfully updated',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LampActionResponse'
                }
              }
            }
          },
          '400': {
            description: 'Invalid brightness value (must be an integer between 0 and 100)',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
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
        description: 'Retrieves audit records of recent lamp switching and dimming events.',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            required: false,
            description: 'Maximum number of history records to retrieve (default: 20, max: 50)',
            schema: {
              type: 'integer',
              default: 20,
              minimum: 1,
              maximum: 50
            }
          }
        ],
        responses: {
          '200': {
            description: 'History list successfully retrieved',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LampHistoryResponse'
                }
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
          timestamp: { type: 'string', format: 'date-time', example: '2026-11-11T07:30:00.000Z' },
          service: { type: 'string', example: 'Smart Pole Backend API' }
        }
      },
      LampStateRequest: {
        type: 'object',
        required: ['state'],
        properties: {
          state: {
            type: 'string',
            enum: ['ON', 'OFF'],
            description: 'Target operational state of the streetlight',
            example: 'ON'
          }
        }
      },
      LampDimmingRequest: {
        type: 'object',
        required: ['brightness'],
        properties: {
          brightness: {
            type: 'integer',
            minimum: 0,
            maximum: 100,
            description: 'Brightness level from 0 to 100 percent',
            example: 75
          }
        }
      },
      LampStatusData: {
        type: 'object',
        properties: {
          poleId: { type: 'string', example: 'POLE-001' },
          status: { type: 'string', enum: ['ON', 'OFF'], example: 'ON' },
          brightness: { type: 'integer', example: 100 },
          mode: { type: 'string', enum: ['MANUAL', 'AUTO'], example: 'MANUAL' },
          lastUpdated: { type: 'string', format: 'date-time', example: '2026-11-11T07:31:00.000Z' }
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
      LampEventItem: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          type: { type: 'string', example: 'STATE_CHANGE' },
          previousState: { type: 'string', example: 'OFF' },
          newState: { type: 'string', example: 'ON' },
          brightness: { type: 'integer', example: 100 },
          source: { type: 'string', example: 'REST_API' },
          timestamp: { type: 'string', format: 'date-time', example: '2026-11-11T07:31:00.000Z' }
        }
      },
      LampHistoryResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          count: { type: 'integer', example: 2 },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/LampEventItem' }
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Invalid lamp state: "HALF_ON". State must be either "ON" or "OFF".' }
        }
      }
    }
  }
};

module.exports = swaggerSpec;

