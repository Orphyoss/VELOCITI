# Velociti - EasyJet Revenue Management System

## Overview
Velociti is an AI-powered revenue management and analytics platform designed for EasyJet. Its core purpose is to deliver strategic insights, competitive intelligence, and performance monitoring across the airline's network through real-time data analysis. Key capabilities include specialized AI agents, robust real-time data processing, and a modern, intuitive web interface. The project's overarching goal is to significantly enhance EasyJet's operational efficiency and market responsiveness, contributing to improved revenue and competitive advantage.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes
- Removed "Action Agents Status" sidebar link as it was not providing meaningful functionality
- Fixed API caching issues for alert generation system
- Alert generation system confirmed working correctly at database level

## System Architecture

### UI/UX Decisions
- **Frontend Framework**: React 18 with TypeScript.
- **Routing**: Wouter for client-side routing.
- **State Management**: Zustand for global state.
- **UI Components**: Shadcn/ui, built on Radix UI primitives.
- **Styling**: Tailwind CSS, incorporating a custom dark theme and an aviation-inspired color palette.

### Technical Implementations
- **Backend Runtime**: Node.js with Express.js.
- **Backend Language**: TypeScript with ES modules.
- **API Design**: RESTful endpoints, complemented by WebSocket support for real-time communication.
- **Database ORM**: Drizzle ORM for type-safe database operations.
- **Session Management**: Express sessions with PostgreSQL storage.
- **Build Tool**: Vite.

### Feature Specifications
- **AI Agent System**: Incorporates three specialized AI agents (Competitive, Performance, Network) designed for autonomous alert generation, feedback-driven learning, and monitoring against configurable thresholds.
- **Real-time Communication**: Utilizes a WebSocket service for pushing dashboard metrics, alerts, and system status updates with automatic reconnection capabilities.
- **LLM Integration**: Primarily uses Writer AI (Palmyra X5) for strategic analysis, with OpenAI GPT-4o serving as a secondary provider for data queries and as a fallback. The system supports user-configurable LLM selection and includes continuous API health monitoring with failover mechanisms.
- **User Interface Modules**: Comprises a Dashboard for executive summaries, an Analyst Workbench for alert management, an AI Agents interface for configuration, a Databricks Genie for data interrogation, Strategic Analysis for long-form insights, and a Data Generation module for populating test data.
- **Data Flow**: AI agents process data, generate alerts stored in PostgreSQL, and broadcast these alerts via WebSockets, ensuring real-time updates to connected clients.
- **Network Performance Section**: Implemented directly within TelosIntelligence.tsx with proper load factor sorting and timeframe selection (24h/7d/30d). Previously unused NetworkOverview component has been archived to prevent confusion.

### System Design Choices
- **Data Storage**: PostgreSQL with standardized database configuration using DEV_SUP_DATABASE_URL for both development and production environments.
- **Schema Management**: Drizzle Kit is used for database migrations and schema evolution, with proven schema containing 1500+ operational records.
- **Data Structure**: A relational design is employed for managing key entities such as users, alerts, agents, feedback, route performance, conversations, system metrics, and activities.
- **High Availability**: The system is designed for high availability, featuring automatic failover capabilities and a scalable architecture to ensure continuous operation.
- **Database Configuration**: Finalized to use DEV_SUP_DATABASE_URL as the production database, ensuring data continuity and proven operational stability.
- **Load Factor & Risk Metrics**: Fully operational using authentic flight performance data from 686+ flight records, providing real-time load factor analysis (78.8% current) and comprehensive risk assessment.
- **Schema Evolution**: Production database maintains legacy operational schema (18-column intelligence_insights) with 1500+ records, while development database uses enhanced schema (15-column structure) for new development. APIs bridge both schemas seamlessly, ensuring data integrity and functionality. Action Agents schema fully synchronized with comprehensive agent configurations, performance metrics, and execution tracking tables for six specialized agents.

### Deployment Configuration
- **Production Deployment**: Achieved via Replit Deployments, utilizing custom build and run scripts defined in the `.replit` file.
- **Build Command**: `npm run build` generates optimized Vite frontend bundles and Node.js backend artifacts.
- **Run Command**: `npm run start` initiates the production server with PostgreSQL connectivity.
- **Deployment Scripts**: A professional deployment pipeline (`scripts/deploy.js`) is in place, including health checks and rollback capabilities.
- **Environment**: The deployment targets an autoscale environment with properly configured environment variables.

## External Dependencies

### Core Infrastructure
- **Neon Database**: Provides serverless PostgreSQL hosting for the primary data store.
- **Replit**: Serves as the integrated development and deployment platform for the project.

### AI/ML Services
- **Writer AI**: The primary Large Language Model (LLM) provider, specifically utilizing the Palmyra X5 model for specialized tasks such as competitive intelligence, network analysis, revenue optimization, and performance attribution.
- **OpenAI**: Functions as a secondary LLM provider, used for general queries and as a fallback mechanism.
- **Pinecone**: A vector database used for Retrieval-Augmented Generation (RAG) to enhance document search capabilities.

### Frontend Libraries
- **React Query**: Manages server state and data caching, optimizing data fetching and synchronization.
- **Radix UI**: Provides accessible and unstyled component primitives for building robust UI.
- **Wouter**: A lightweight routing library for client-side navigation.
- **Tailwind CSS**: A utility-first CSS framework employed for rapid and consistent styling.

### Backend Services
- **Express.js**: The foundational web application framework for the backend.
- **WebSocket (ws)**: Enables real-time, bidirectional communication between clients and the server.
- **Drizzle ORM**: Facilitates type-safe interaction with the database, abstracting SQL queries.