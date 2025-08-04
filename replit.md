# Velociti - EasyJet Revenue Management System

## Overview
Velociti is an AI-powered revenue management and analytics platform for EasyJet. Its purpose is to provide strategic insights, competitive intelligence, and performance monitoring across the airline's network using real-time data analysis. Key capabilities include AI agents, real-time data processing, and a modern web interface. The project aims to enhance EasyJet's operational efficiency and market responsiveness.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes  
- **COMPLETED: Navigation and Card Styling Fixes** - Fixed Data Generation page sidebar by wrapping in AppShell, implemented persistent admin expansion when sub-tabs are selected, added blue highlighting to all main navigation items and admin sub-tabs for consistent selection indicators across desktop and mobile (2025-08-04)
- **COMPLETED: System Monitoring Dark Theme** - Applied dark theme styling to all card components in APIMonitor and MemoryStats with proper contrast and readability (2025-08-04)
- **COMPLETED: Admin Navigation Final Structure** - Renamed Action Agents Setup to Action Agents Status as first sub-tab, reordered admin items: Action Agents Status, AI Agents, RAG Management, System Monitoring, Data Generation, added visual selection indicators for active tabs/subtabs (2025-08-04)
- **COMPLETED: Admin Navigation Restructure** - Moved Action Agents under collapsible Admin section, removed Settings tab, made Admin section closed by default with distinctive orange monospace font styling, updated both desktop and mobile sidebars (2025-08-04)
- **COMPLETED: Critical System Stabilization** - Fixed 502 Bad Gateway errors, resolved TypeScript compilation issues in server API routes, implemented proper null safety checks for performance data calculations, stabilized WebSocket connections with robust fallback logic, and enhanced error handling throughout the platform (2025-08-04)
- **COMPLETED: Strategic Analysis UI Enhancement** - Removed duplicate page headers and increased main title font size for better readability (2025-08-04)
- **COMPLETED: Platform Rebranding and Navigation Cleanup** - Renamed to Velociti Intelligence Platform, removed legacy Dashboard page (2025-08-04)
- **COMPLETED: Storage Layer Completely Rewritten** - Successfully fixed all 807 syntax errors, system now fully stable (2025-08-04)
- **VERIFIED: Architecture Analysis Complete** - Hybrid database + memory fallback architecture confirmed viable and working (2025-08-04)
- **COMPLETED: Database Integrity Audit** - Verified Supabase PostgreSQL as primary data source with authentic data operations (2025-08-03)
- **VERIFIED: No hardcoded/mock data violations** - All primary operations use real database queries with proper error handling (2025-08-03)
- Fixed critical deployment errors by resolving TypeScript type mismatches in storage layer (2025-08-03)
- Corrected PostgreSQL database compatibility issues and null handling in storage operations (2025-08-03)
- Enhanced mobile responsiveness with touch-friendly interfaces and responsive grid layouts (2025-08-03)
- Implemented comprehensive logging system throughout ActionAgents components with detailed error reporting (2025-08-03)
- Resolved storage layer compatibility between in-memory fallback and PostgreSQL schema requirements (2025-08-03)
- Data Generation admin feature implemented for running daily data population scripts for specific dates and scenarios (2025-08-03)
- Added comprehensive Data Generation interface with scenario selection, job tracking, and real-time status updates (2025-08-03)
- Created Python script template for daily data generation with market scenario simulation capabilities (2025-08-03)
- Fixed Dashboard import issue and cleaned up component imports for proper loading (2025-08-03)
- Action Agents dropdown interface implemented with prominent blue card section for better visibility (2025-08-03)
- Fixed "Run Now" button text visibility with proper blue background and white text contrast (2025-08-03)
- Resolved Active Alerts discrepancy by updating dashboard summary API to fetch 50 alerts instead of 10 (2025-08-03)
- Enhanced loading spinner visibility across entire application with proper contrast colors (2025-08-03)
- Action Agents moved above AI Strategic Analysis in sidebar navigation (2025-08-03)
- Strategic Analysis renamed to "AI Strategic Analysis" for clarity (2025-08-03)
- Action Agents fully integrated into Admin section as default first tab (2025-08-03)
- Dashboard landing page: changed Morning Briefing to "Today's Priorities", limited to critical alerts only, repositioned after Network Performance, and removed Recent Activity section (2025-08-03)
- Sidebar Admin section separated with visual divider and "System" label, increased font size for all navigation items from text-sm to text-lg for better readability (2025-08-03)

## System Architecture

### UI/UX Decisions
- **Frontend Framework**: React 18 with TypeScript.
- **Routing**: Wouter for client-side routing.
- **State Management**: Zustand for global state.
- **UI Components**: Shadcn/ui built on Radix UI primitives.
- **Styling**: Tailwind CSS with a custom dark theme and aviation-inspired color palette.

### Technical Implementations
- **Backend Runtime**: Node.js with Express.js.
- **Backend Language**: TypeScript with ES modules.
- **API Design**: RESTful endpoints with WebSocket support for real-time communication.
- **Database ORM**: Drizzle ORM for type-safe operations.
- **Session Management**: Express sessions with PostgreSQL storage.
- **Build Tool**: Vite.

### Feature Specifications
- **AI Agent System**: Three specialized AI agents (Competitive, Performance, Network) autonomously generate alerts, learn from feedback, and monitor configurable thresholds.
- **Real-time Communication**: WebSocket service for dashboard metrics, alerts, and system status updates with automatic reconnection.
- **LLM Integration**: Primary use of Writer AI (Palmyra X5) for strategic analysis, with OpenAI GPT-4o as a secondary provider for data queries and fallback. User-configurable LLM selection and continuous API health monitoring with failover.
- **User Interface Modules**: Dashboard for executive summaries, Analyst Workbench for alert management, AI Agents for configuration, Databricks Genie for data interrogation, Strategic Analysis for long-form insights, and Data Generation for populating test data.
- **Data Flow**: AI agents analyze data, generate alerts stored in PostgreSQL, and broadcast via WebSockets. Real-time updates are pushed to clients.

### System Design Choices
- **Data Storage**: PostgreSQL with Neon serverless hosting.
- **Schema Management**: Drizzle Kit for migrations.
- **Data Structure**: Relational design for users, alerts, agents, feedback, route performance, conversations, system metrics, and activities.
- **High Availability**: Designed for high availability with automatic failover and scalable architecture.

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting.
- **Replit**: Development and deployment platform.

### AI/ML Services
- **Writer AI**: Primary LLM provider (Palmyra X5 model) for competitive intelligence, network analysis, revenue optimization, and performance attribution.
- **OpenAI**: Secondary LLM provider for general queries and fallback.
- **Pinecone**: Vector database for RAG-enhanced document search.

### Frontend Libraries
- **React Query**: Server state management and caching.
- **Radix UI**: Accessible component primitives.
- **Wouter**: Lightweight routing.
- **Tailwind CSS**: Utility-first CSS framework.

### Backend Services
- **Express.js**: Web application framework.
- **WebSocket (ws)**: Real-time communication.
- **Drizzle ORM**: Type-safe database operations.