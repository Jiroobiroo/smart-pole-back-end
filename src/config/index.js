require('dotenv').config();

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  poleId: process.env.POLE_ID || 'POLE-001',
  defaultLampState: process.env.DEFAULT_LAMP_STATE || 'OFF',
  defaultBrightness: parseInt(process.env.DEFAULT_BRIGHTNESS, 10) || 100
};

module.exports = config;
