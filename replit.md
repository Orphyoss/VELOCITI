# Velociti - EasyJet Revenue Management System

## Overview

Velociti is a sophisticated revenue management and analytics platform designed for EasyJet's operations. It combines AI-powered agents with real-time data analysis to provide strategic insights, competitive intelligence, and performance monitoring across the airline's network. The system features a modern React frontend with a Node.js/Express backend, utilizing PostgreSQL for data persistence and WebSocket connections for real-time updates.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: Zustand for global state management
- **UI Components**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme and aviation-inspired color palette
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with WebSocket support for real-time communication
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL storage

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle Kit for migrations and schema updates
- **Database Structure**: Relational design with tables for users, alerts, agents, feedback, route performance, conversations, system metrics, and activities

## Key Components

### AI Agent System
The system includes three specialized AI agents:
- **Competitive Agent**: Monitors competitor pricing and market positioning
- **Performance Agent**: Analyzes route performance against forecasts
- **Network Agent**: Evaluates overall network optimization

Each agent operates autonomously, generating alerts based on configurable thresholds and learning from user feedback to improve accuracy over time.

### Real-time Communication
- **WebSocket Service**: Handles real-time updates for dashboard metrics, alerts, and system status
- **Connection Management**: Automatic reconnection with exponential backoff
- **Message Types**: Support for subscriptions, real-time data updates, and system notifications

### LLM Integration
- **Primary Provider**: Writer AI (Palmyra X5 model) for strategic analysis with enterprise-grade insights
- **Secondary Provider**: OpenAI GPT-4o for data queries, fallback operations, and general assistance
- **Writer API Features**: Competitive intelligence, network analysis, performance attribution, strategic planning
- **Provider Selection**: User-configurable switching between Writer and OpenAI in Strategic Analysis module
- **Health Monitoring**: Continuous API health checks with status reporting and automatic failover
- **Use Cases**: Strategic analysis generation, competitive intelligence, data interrogation, and natural language processing

### User Interface Modules
1. **Dashboard**: Executive summary with key metrics and morning briefings
2. **Analyst Workbench**: Detailed alert management and filtering capabilities
3. **AI Agents**: Agent configuration, performance monitoring, and feedback systems
4. **Databricks Genie**: Data interrogation and query interface
5. **Strategic Analysis**: Long-form analysis generation and insights

## Data Flow

### Alert Generation Process
1. AI agents analyze data sources (pricing, performance, network metrics)
2. Agents generate alerts based on configured thresholds and patterns
3. Alerts are stored in PostgreSQL with metadata and confidence scores
4. WebSocket service broadcasts new alerts to connected clients
5. Users can provide feedback to improve agent accuracy

### Real-time Updates
1. Backend services collect metrics and performance data
2. System metrics are stored with timestamps for historical analysis
3. WebSocket connections push updates to active dashboard clients
4. Frontend state management updates UI components reactively

### User Interaction Flow
1. Users authenticate and receive session management
2. Dashboard loads with real-time data subscriptions
3. User actions (alert dismissal, feedback) trigger API calls
4. Backend processes changes and broadcasts updates via WebSocket
5. All connected clients receive synchronized updates

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Replit**: Development and deployment platform with integrated tooling

### AI/ML Services
- **Writer AI**: Primary LLM provider using Palmyra X5 model for enterprise strategic analysis
  - Competitive intelligence generation
  - Network performance analysis
  - Revenue optimization recommendations
  - Performance attribution analysis
- **OpenAI**: Secondary LLM provider for general queries and fallback operations
- **Pinecone**: Vector database for RAG-enhanced document search and context retrieval

### Frontend Libraries
- **React Query**: Server state management and caching
- **Radix UI**: Accessible component primitives for complex UI patterns
- **Wouter**: Lightweight routing solution for single-page application navigation
- **Tailwind CSS**: Utility-first CSS framework with custom design system

### Backend Services
- **Express.js**: Web application framework with middleware support
- **WebSocket (ws)**: Real-time bidirectional communication
- **Drizzle ORM**: Type-safe database operations with automatic migrations

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Neon serverless PostgreSQL with development credentials
- **Environment Variables**: Separate configuration for development and production

### Production Build
- **Frontend**: Static asset generation with Vite build optimization
- **Backend**: ESBuild compilation with Node.js target and external dependencies
- **Database Migrations**: Automated schema updates using Drizzle Kit

### Monitoring and Observability
- **Real-time Metrics**: System performance tracking through custom metrics collection
- **API Health Monitoring**: Continuous health checks for OpenAI, Writer API, Pinecone, and internal services
- **Performance Analytics**: Response time tracking, error rate monitoring, and uptime statistics
- **Agent Performance**: Accuracy tracking and learning analytics
- **User Activity**: Comprehensive activity logging for audit and analysis purposes

### Recent Changes (January 2025)
- **Writer API Integration**: Successfully integrated Writer Palmyra X5 model for enhanced strategic analysis
- **Provider Selection**: Added user-configurable LLM provider switching in Strategic Analysis module
- **Health Monitoring**: Extended API monitoring to include Writer API with comprehensive health checks
- **Strategic Analysis Enhancement**: Improved interface with provider selection and real-time status indicators
- **Streaming & Performance Optimization (January 31, 2025)**: Implemented comprehensive streaming responses and intelligent caching system
  - Real-time word-by-word streaming for both Writer API and OpenAI responses
  - Intelligent caching with 30-60 minute TTL and automatic cleanup
  - Performance optimization reducing response times from 40+ seconds to 4-6 seconds
  - Comprehensive logging and error tracking for debugging and monitoring
  - Cache management tools and performance monitoring dashboard
  - Database migration fixes for AI agent error resolution

The system is designed for high availability with automatic failover capabilities, real-time data synchronization, and scalable architecture to handle EasyJet's operational demands.