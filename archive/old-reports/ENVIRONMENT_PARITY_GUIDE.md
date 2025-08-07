# Environment Parity Guide
## Making Dev and Production Environments Identical

### Current Differences Identified

1. **Logging Levels**
   - Dev: DEBUG level with detailed messages
   - Prod: INFO level with sanitized messages

2. **Error Detail Exposure**
   - Dev: Full error messages and stack traces
   - Prod: Generic error messages only

3. **Development Tools**
   - Dev: Cartographer plugin enabled for debugging
   - Prod: No development plugins

4. **Database Connection Pooling**
   - Dev: Small connection pool (5 connections)
   - Prod: Large connection pool (20 connections)

### Unified Configuration System

Created `shared/config.ts` that provides:

```typescript
// Environment-aware configuration
const config = getConfig();

// Feature flags for environment parity
const shouldIncludeDetailedErrors = () => config.features.detailedErrors;
const shouldUseCartographer = () => config.features.cartographerPlugin;
const isDevelopment = () => config.environment === 'development';
```

### Migration Steps

1. **Replace Environment Checks**
   ```typescript
   // Old way
   if (process.env.NODE_ENV === 'development') {
     // development logic
   }

   // New way
   import { isDevelopment } from '@shared/config';
   if (isDevelopment()) {
     // environment-specific logic
   }
   ```

2. **Standardize Error Handling**
   ```typescript
   // Old way
   details: process.env.NODE_ENV === 'development' ? error.message : undefined

   // New way
   details: shouldIncludeDetailedErrors() ? error.message : undefined
   ```

3. **Consistent Logging**
   ```typescript
   // All logging now uses unified config
   const logger = new VelocitiLogger(); // Automatically uses config
   ```

### Testing Environment Parity

1. **Development Mode**
   ```bash
   NODE_ENV=development npm run dev
   ```

2. **Production Mode**
   ```bash
   NODE_ENV=production npm run build
   NODE_ENV=production npm run start
   ```

3. **Staging Mode** (New!)
   ```bash
   NODE_ENV=staging npm run dev
   ```

### Configuration Overrides

You can now override specific settings:

```bash
# Production with debug logging
NODE_ENV=production DEBUG_LEVEL=DEBUG npm run start

# Development without detailed errors
NODE_ENV=development DETAILED_ERRORS=false npm run dev
```

### Key Benefits

1. **Predictable Behavior**: Same logic path in dev and prod
2. **Feature Flags**: Toggle features without code changes
3. **Environment Validation**: Required environment variables checked at startup
4. **Consistent API Responses**: Same error format across environments
5. **Scalable Configuration**: Easy to add new environments (staging, testing)

### Deployment Checklist

- [ ] Database URL configured for target environment
- [ ] API keys (OpenAI, Writer, Pinecone) set correctly
- [ ] Logging level appropriate for environment
- [ ] Error detail exposure configured correctly
- [ ] Connection pool sizes optimized
- [ ] Feature flags set appropriately

### Monitoring Environment Differences

The unified config system logs configuration on startup:

```
[Config] Environment: production
[Config] Database Pool Size: 20
[Config] Logging Level: INFO
[Config] Detailed Errors: false
[Config] Cartographer: false
```

This makes it easy to verify environment consistency.