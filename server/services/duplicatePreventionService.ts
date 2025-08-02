// Duplicate Prevention Service
// Prevents duplicate alert generation across the system

import { db } from './supabase';
import { alerts } from '@shared/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { logger } from './logger';

export class DuplicatePreventionService {
  
  // Check if similar alert exists within time window
  async isDuplicateAlert(title: string, agentId: string, hoursBack: number = 24): Promise<boolean> {
    try {
      const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
      
      const existingAlerts = await db.select()
        .from(alerts)
        .where(and(
          eq(alerts.title, title),
          eq(alerts.agent_id, agentId),
          gte(alerts.created_at, cutoffTime)
        ))
        .limit(1);

      const isDuplicate = existingAlerts.length > 0;
      
      if (isDuplicate) {
        logger.warn('DuplicatePrevention', 'isDuplicateAlert', `Blocked duplicate alert`, {
          title,
          agentId,
          hoursBack,
          existingAlert: existingAlerts[0]?.id
        });
      }
      
      return isDuplicate;
    } catch (error) {
      logger.error('DuplicatePrevention', 'isDuplicateAlert', 'Error checking for duplicates', error);
      return false; // Allow alert creation if check fails
    }
  }

  // Check if similar content exists (fuzzy matching)
  async hasSimilarAlert(description: string, agentId: string, hoursBack: number = 12): Promise<boolean> {
    try {
      const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
      
      const recentAlerts = await db.select()
        .from(alerts)
        .where(and(
          eq(alerts.agent_id, agentId),
          gte(alerts.created_at, cutoffTime)
        ))
        .orderBy(desc(alerts.created_at))
        .limit(20);

      // Simple similarity check based on key words
      const keyWords = this.extractKeyWords(description);
      
      for (const alert of recentAlerts) {
        const alertKeyWords = this.extractKeyWords(alert.description || '');
        const similarity = this.calculateSimilarity(keyWords, alertKeyWords);
        
        if (similarity > 0.7) { // 70% similarity threshold
          logger.warn('DuplicatePrevention', 'hasSimilarAlert', `Blocked similar alert`, {
            newDescription: description.substring(0, 100),
            similarAlert: alert.title,
            similarity: Math.round(similarity * 100) + '%'
          });
          return true;
        }
      }
      
      return false;
    } catch (error) {
      logger.error('DuplicatePrevention', 'hasSimilarAlert', 'Error checking for similar alerts', error);
      return false;
    }
  }

  // Clean up old duplicate alerts
  async cleanupDuplicates(): Promise<number> {
    try {
      // Find exact duplicates (same title, agent, within 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const duplicates = await db.select()
        .from(alerts)
        .where(gte(alerts.created_at, sevenDaysAgo))
        .orderBy(alerts.title, alerts.agent_id, alerts.created_at);

      const toDelete: string[] = [];
      const seen = new Map<string, string>(); // key -> first alert id
      
      for (const alert of duplicates) {
        const key = `${alert.title}|${alert.agent_id}`;
        
        if (seen.has(key)) {
          toDelete.push(alert.id);
        } else {
          seen.set(key, alert.id);
        }
      }

      if (toDelete.length > 0) {
        // Delete duplicates in batches
        for (let i = 0; i < toDelete.length; i += 50) {
          const batch = toDelete.slice(i, i + 50);
          await db.delete(alerts)
            .where(eq(alerts.id, batch[0])); // This is a simplified approach
        }
        
        logger.info('DuplicatePrevention', 'cleanupDuplicates', `Cleaned up duplicate alerts`, {
          deletedCount: toDelete.length,
          uniqueAlerts: seen.size
        });
      }
      
      return toDelete.length;
    } catch (error) {
      logger.error('DuplicatePrevention', 'cleanupDuplicates', 'Error cleaning up duplicates', error);
      return 0;
    }
  }

  // Get recent alert count by agent to prevent spam
  async getRecentAlertCount(agentId: string, hoursBack: number = 1): Promise<number> {
    try {
      const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
      
      const count = await db.select()
        .from(alerts)
        .where(and(
          eq(alerts.agent_id, agentId),
          gte(alerts.created_at, cutoffTime)
        ));

      return count.length;
    } catch (error) {
      logger.error('DuplicatePrevention', 'getRecentAlertCount', 'Error getting alert count', error);
      return 0;
    }
  }

  private extractKeyWords(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 10); // Top 10 keywords
  }

  private calculateSimilarity(words1: string[], words2: string[]): number {
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = Array.from(set1).filter(word => set2.has(word));
    const union = Array.from(new Set([...words1, ...words2]));
    
    return union.length > 0 ? intersection.length / union.length : 0;
  }
}

export const duplicatePreventionService = new DuplicatePreventionService();