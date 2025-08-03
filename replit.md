# Velociti - EasyJet Revenue Management System

## Overview
Velociti is an AI-powered revenue management and analytics platform for EasyJet. Its purpose is to provide strategic insights, competitive intelligence, and performance monitoring across the airline's network using real-time data analysis. Key capabilities include AI agents, real-time data processing, and a modern web interface. The project aims to enhance EasyJet's operational efficiency and market responsiveness.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes
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
- **User Interface Modules**: Dashboard for executive summaries, Analyst Workbench for alert management, AI Agents for configuration, Databricks Genie for data interrogation, and Strategic Analysis for long-form insights.
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