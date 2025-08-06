import type { Express } from "express";
import { logger } from "../services/logger";
import { DatabaseDataGenerator } from "../services/dataGenerator";

interface DataGenerationJob {
  id: string;
  date: string;
  scenario: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  recordCounts?: Record<string, number>;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

// In-memory job storage (in production, this would be in the database)
const jobs: DataGenerationJob[] = [];
const dataGenerator = new DatabaseDataGenerator();

export async function dataGenerationRoutes(app: Express) {
  logger.info('DataGenerationRoutes', 'init', 'Registering data generation routes');

  // Get recent data generation jobs
  app.get("/api/admin/data-generation/jobs", async (req, res) => {
    try {
      logger.info('DataGenerationRoutes', 'jobs', 'Fetching recent jobs');
      
      // Return the most recent jobs, sorted by date
      const recentJobs = jobs
        .sort((a, b) => new Date(b.startedAt || b.date).getTime() - new Date(a.startedAt || a.date).getTime())
        .slice(0, 10);

      res.json(recentJobs);
    } catch (error) {
      logger.error('DataGenerationRoutes', 'jobs', 'Failed to fetch jobs', error);
      res.status(500).json({
        error: 'Failed to fetch data generation jobs',
        jobs: []
      });
    }
  });

  // Start a new data generation job
  app.post("/api/admin/data-generation/generate", async (req, res) => {
    try {
      const { date, scenario } = req.body;
      
      if (!date || !scenario) {
        return res.status(400).json({
          error: 'Date and scenario are required',
          received: { date, scenario }
        });
      }

      // Create new job
      const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const job: DataGenerationJob = {
        id: jobId,
        date,
        scenario,
        status: 'pending',
        startedAt: new Date().toISOString()
      };

      jobs.push(job);

      logger.info('DataGenerationRoutes', 'generate', 'Starting data generation job', {
        jobId,
        date,
        scenario
      });

      // Start generation in background
      res.json({
        success: true,
        jobId,
        message: `Data generation started for ${date} with scenario: ${scenario}`,
        status: 'started'
      });

      // Execute data generation asynchronously
      setImmediate(async () => {
        try {
          // Update job status
          job.status = 'running';
          
          logger.info('DataGenerationRoutes', 'execute', 'Running data generation', {
            jobId,
            date,
            scenario
          });

          // Run the actual data generation
          const results = await dataGenerator.generateData({ date, scenario });
          
          // Update job with results
          job.status = 'completed';
          job.completedAt = new Date().toISOString();
          job.recordCounts = results;

          logger.info('DataGenerationRoutes', 'complete', 'Data generation completed', {
            jobId,
            results,
            totalRecords: Object.values(results).reduce((sum, count) => sum + count, 0)
          });

        } catch (error) {
          job.status = 'failed';
          job.completedAt = new Date().toISOString();
          job.error = error.message;

          logger.error('DataGenerationRoutes', 'failed', 'Data generation failed', {
            jobId,
            error: error.message,
            date,
            scenario
          });
        }
      });

    } catch (error) {
      logger.error('DataGenerationRoutes', 'generate', 'Failed to start data generation', error);
      res.status(500).json({
        error: 'Failed to start data generation',
        details: error.message
      });
    }
  });

  // Get last available data date
  app.get("/api/admin/data-generation/last-data-date", async (req, res) => {
    try {
      // Get the most recent completion date from jobs
      const lastCompletedJob = jobs
        .filter(job => job.status === 'completed')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .at(0);

      const lastDate = lastCompletedJob ? lastCompletedJob.date : new Date().toISOString().split('T')[0];

      logger.info('DataGenerationRoutes', 'lastDate', 'Retrieved last data date', { lastDate });

      res.json({
        lastDate,
        source: lastCompletedJob ? 'completed_job' : 'current_date'
      });
    } catch (error) {
      logger.error('DataGenerationRoutes', 'lastDate', 'Failed to get last data date', error);
      res.status(500).json({
        error: 'Failed to get last data date',
        lastDate: new Date().toISOString().split('T')[0]
      });
    }
  });

  // Get job status by ID
  app.get("/api/admin/data-generation/jobs/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = jobs.find(j => j.id === jobId);

      if (!job) {
        return res.status(404).json({
          error: 'Job not found',
          jobId
        });
      }

      res.json(job);
    } catch (error) {
      logger.error('DataGenerationRoutes', 'jobStatus', 'Failed to get job status', error);
      res.status(500).json({
        error: 'Failed to get job status'
      });
    }
  });

  logger.info('DataGenerationRoutes', 'init', 'Data generation routes registered successfully');
}