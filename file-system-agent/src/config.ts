import { AgentConfig } from './types.js';

export const defaultConfig: AgentConfig = {
  port: parseInt(process.env.AGENT_PORT || '4001'),
  host: process.env.AGENT_HOST || '0.0.0.0',
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*']
};

export function getConfig(): AgentConfig {
  return {
    ...defaultConfig,
    // Permettre la surcharge via les variables d'environnement
    port: parseInt(process.env.AGENT_PORT || defaultConfig.port.toString()),
    host: process.env.AGENT_HOST || defaultConfig.host,
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : defaultConfig.corsOrigins
  };
}