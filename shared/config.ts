// Unified Configuration System for Velociti Intelligence Platform
// Ensures consistent behavior across development and production environments

export interface AppConfig {
  environment: 'development' | 'production' | 'staging';
  database: {
    url: string;
    poolSize: number;
    timeout: number;
  };
  logging: {
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    includeDetails: boolean;
    maxHistory: number;
  };
  api: {
    openai: {
      apiKey: string;
      model: string;
      timeout: number;
    };
    writer: {
      apiKey: string;
      timeout: number;
    };
    pinecone: {
      apiKey: string;
      timeout: number;
    };
  };
  features: {
    cartographerPlugin: boolean;
    detailedErrors: boolean;
    webSocketReconnect: boolean;
    caching: boolean;
  };
  server: {
    port: number;
    host: string;
    corsEnabled: boolean;
  };
}

// Environment-specific configurations
const configurations: Record<string, AppConfig> = {
  development: {
    environment: 'development',
    database: {
      url: process.env.DATABASE_URL || '',
      poolSize: 5,
      timeout: 30000,
    },
    logging: {
      level: 'DEBUG',
      includeDetails: true,
      maxHistory: 1000,
    },
    api: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: 'gpt-4o',
        timeout: 30000,
      },
      writer: {
        apiKey: process.env.WRITER_API_KEY || '',
        timeout: 30000,
      },
      pinecone: {
        apiKey: process.env.PINECONE_API_KEY || '',
        timeout: 30000,
      },
    },
    features: {
      cartographerPlugin: true,
      detailedErrors: true,
      webSocketReconnect: true,
      caching: true,
    },
    server: {
      port: 5000,
      host: '0.0.0.0',
      corsEnabled: true,
    },
  },
  production: {
    environment: 'production',
    database: {
      url: process.env.DATABASE_URL || '',
      poolSize: 20,
      timeout: 15000,
    },
    logging: {
      level: 'INFO',
      includeDetails: false,
      maxHistory: 500,
    },
    api: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: 'gpt-4o',
        timeout: 15000,
      },
      writer: {
        apiKey: process.env.WRITER_API_KEY || '',
        timeout: 15000,
      },
      pinecone: {
        apiKey: process.env.PINECONE_API_KEY || '',
        timeout: 15000,
      },
    },
    features: {
      cartographerPlugin: false,
      detailedErrors: false,
      webSocketReconnect: true,
      caching: true,
    },
    server: {
      port: parseInt(process.env.PORT || '5000'),
      host: '0.0.0.0',
      corsEnabled: false,
    },
  },
  staging: {
    environment: 'staging',
    database: {
      url: process.env.DATABASE_URL || '',
      poolSize: 10,
      timeout: 20000,
    },
    logging: {
      level: 'INFO',
      includeDetails: true,
      maxHistory: 750,
    },
    api: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: 'gpt-4o',
        timeout: 20000,
      },
      writer: {
        apiKey: process.env.WRITER_API_KEY || '',
        timeout: 20000,
      },
      pinecone: {
        apiKey: process.env.PINECONE_API_KEY || '',
        timeout: 20000,
      },
    },
    features: {
      cartographerPlugin: false,
      detailedErrors: true,
      webSocketReconnect: true,
      caching: true,
    },
    server: {
      port: parseInt(process.env.PORT || '5000'),
      host: '0.0.0.0',
      corsEnabled: true,
    },
  },
};

// Get current environment configuration
export function getConfig(): AppConfig {
  const env = process.env.NODE_ENV || 'development';
  const config = configurations[env];
  
  if (!config) {
    throw new Error(`Unknown environment: ${env}. Valid environments: ${Object.keys(configurations).join(', ')}`);
  }
  
  // Validate required environment variables
  if (!config.database.url) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  
  return config;
}

// Environment utility functions
export const isProduction = () => getConfig().environment === 'production';
export const isDevelopment = () => getConfig().environment === 'development';
export const isStaging = () => getConfig().environment === 'staging';

// Feature flags
export const shouldIncludeDetailedErrors = () => getConfig().features.detailedErrors;
export const shouldUseCartographer = () => getConfig().features.cartographerPlugin;
export const shouldEnableCaching = () => getConfig().features.caching;

export default getConfig();