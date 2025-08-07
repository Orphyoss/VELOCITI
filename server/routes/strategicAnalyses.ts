import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { strategicAnalyses } from '../../shared/schema';
import { desc, eq } from 'drizzle-orm';

const router = Router();

// Schema for creating strategic analysis
const createAnalysisSchema = z.object({
  prompt: z.string().min(1),
  response: z.string().min(1),
  provider: z.string(),
  useRAG: z.boolean().default(false),
  ragContext: z.string().optional(),
  confidence: z.number().min(0).max(1).default(0.9),
  status: z.enum(['running', 'completed', 'failed']).default('completed'),
  metadata: z.record(z.any()).default({})
});

// Get all strategic analyses for current user
router.get('/analyses', async (req, res) => {
  try {
    const analyses = await db
      .select()
      .from(strategicAnalyses)
      .orderBy(desc(strategicAnalyses.createdAt))
      .limit(50);

    res.json({
      success: true,
      data: analyses
    });
  } catch (error) {
    console.error('Failed to fetch strategic analyses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch strategic analyses'
    });
  }
});

// Create new strategic analysis
router.post('/analyses', async (req, res) => {
  try {
    const data = createAnalysisSchema.parse(req.body);
    
    const [analysis] = await db
      .insert(strategicAnalyses)
      .values({
        ...data,
        userId: null, // TODO: Add user authentication
      })
      .returning();

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Failed to create strategic analysis:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create strategic analysis'
    });
  }
});

// Get specific analysis by ID
router.get('/analyses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [analysis] = await db
      .select()
      .from(strategicAnalyses)
      .where(eq(strategicAnalyses.id, id))
      .limit(1);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Failed to fetch strategic analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch strategic analysis'
    });
  }
});

// Update analysis status (for running analyses)
router.patch('/analyses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateSchema = z.object({
      status: z.enum(['running', 'completed', 'failed']).optional(),
      response: z.string().optional(),
      metadata: z.record(z.any()).optional()
    });
    
    const updates = updateSchema.parse(req.body);
    
    const [analysis] = await db
      .update(strategicAnalyses)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(strategicAnalyses.id, id))
      .returning();

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Failed to update strategic analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update strategic analysis'
    });
  }
});

export default router;