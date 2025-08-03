import { db } from './supabase';
import { agents } from '@shared/schema';
import { eq } from 'drizzle-orm';
import type { Agent } from '@shared/schema';

export class DatabaseInitializer {
  private static initialized = false;

  static async initializeDatabase() {
    if (this.initialized) return;

    try {
      await this.ensureRequiredAgents();
      this.initialized = true;
      console.log('[DatabaseInitializer] Database initialization completed');
    } catch (error) {
      console.error('[DatabaseInitializer] Failed to initialize database:', error);
      throw error;
    }
  }

  private static async ensureRequiredAgents() {
    const requiredAgents: Omit<Agent, 'createdAt' | 'updatedAt'>[] = [
      {
        id: 'competitive',
        name: 'Competitive Intelligence Agent',
        status: 'active',
        accuracy: '0.00',
        totalAnalyses: 0,
        successfulPredictions: 0,
        configuration: { threshold: 0.05, monitoring_frequency: 'hourly' },
        lastActive: new Date(),
      },
      {
        id: 'performance',
        name: 'Route Performance Agent',
        status: 'active',
        accuracy: '0.00',
        totalAnalyses: 0,
        successfulPredictions: 0,
        configuration: { variance_threshold: 0.03, lookback_days: 7 },
        lastActive: new Date(),
      },
      {
        id: 'network',
        name: 'Network Optimization Agent',
        status: 'active',
        accuracy: '0.00',
        totalAnalyses: 0,
        successfulPredictions: 0,
        configuration: { efficiency_threshold: 0.02, analysis_depth: 'comprehensive' },
        lastActive: new Date(),
      }
    ];

    for (const agent of requiredAgents) {
      try {
        // Check if agent exists
        const existing = await db.select().from(agents).where(eq(agents.id, agent.id)).limit(1);
        
        if (existing.length === 0) {
          // Create agent with timestamps
          const agentWithTimestamps = {
            ...agent,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await db.insert(agents).values(agentWithTimestamps);
          console.log(`[DatabaseInitializer] Created agent: ${agent.name}`);
        } else {
          console.log(`[DatabaseInitializer] Agent already exists: ${agent.name}`);
        }
      } catch (error) {
        console.error(`[DatabaseInitializer] Error ensuring agent ${agent.id}:`, error);
      }
    }
  }
}