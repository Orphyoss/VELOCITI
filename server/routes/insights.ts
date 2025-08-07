import { Express } from 'express';
import { db } from '../db/index';
import { intelligence_insights } from '../../shared/schema';
import { gte } from 'drizzle-orm';

export async function insightsRoutes(app: Express): Promise<void> {
  // Insights statistics endpoint for Memory Stats component
  app.get('/api/insights/stats', async (req, res) => {
    try {
      // Get insights from the last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const insightsData = await db
        .select({
          id: intelligence_insights.id,
          insightType: intelligence_insights.insightType,
          confidenceScore: intelligence_insights.confidence_score
        })
        .from(intelligence_insights)
        .where(gte(intelligence_insights.insight_date, thirtyDaysAgo));
      
      // Calculate learning metrics
      const totalInsights = insightsData.length;
      const highConfidenceInsights = insightsData.filter(insight => 
        parseFloat(insight.confidence_score || '0') >= 0.8
      ).length;
      
      // Count insights by type for learning categorization
      const learningByType = insightsData.reduce((acc, insight) => {
        const type = insight.insightType || 'general';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      res.json({
        totalInsights,
        highConfidenceInsights,
        learningAccuracy: totalInsights > 0 ? (highConfidenceInsights / totalInsights) * 100 : 0,
        learningByType,
        period: '30 days'
      });
    } catch (error) {
      console.error('Error fetching insights stats:', error);
      res.json({
        totalInsights: 0,
        highConfidenceInsights: 0,
        learningAccuracy: 0,
        learningByType: {},
        period: '30 days'
      });
    }
  });
}