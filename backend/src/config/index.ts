import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,

  // API keys
  blockCypherToken: process.env.BLOCKCYPHER_TOKEN,
  etherscanToken: process.env.ETHERSCAN_TOKEN,

  // API endpoints
  blockCypherUrl: 'https://api.blockcypher.com/v1',
  etherscanUrl: 'https://api.etherscan.io/api',

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
} as const;

// Type for the config object
export type Config = typeof config;
