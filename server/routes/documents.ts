import type { Express } from "express";
import multer from "multer";
import { pineconeService } from "../services/pinecone";
import { documentProcessor } from "../services/documentProcessor";
import { logger } from "../services/logger";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const supportedTypes = documentProcessor.getSupportedTypes();
    if (supportedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  }
});

export async function documentsRoutes(app: Express) {
  logger.info('DocumentsRoutes', 'init', 'Registering documents routes');

  // List documents endpoint
  app.get("/api/admin/documents", async (req, res) => {
    try {
      logger.info('DocumentsRoutes', 'listDocuments', 'Fetching documents from Pinecone');
      const documents = await pineconeService.listDocuments();
      logger.info('DocumentsRoutes', 'listDocuments', 'Documents retrieved', { 
        count: documents.length 
      });
      
      res.json({
        documents,
        stats: {
          totalVectors: documents.length,
          namespaces: { "": { recordCount: documents.length } }
        }
      });
    } catch (error) {
      logger.error('DocumentsRoutes', 'listDocuments', 'Failed to list documents', error);
      res.status(500).json({
        error: 'Failed to list documents',
        details: error.message,
        documents: [],
        stats: {
          totalVectors: 0,
          namespaces: { "": { recordCount: 0 } }
        }
      });
    }
  });

  // Upload document endpoint
  app.post("/api/admin/documents/upload", upload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      logger.info('DocumentsRoutes', 'uploadDocument', 'Processing upload', { 
        filename: req.file.originalname,
        size: req.file.size 
      });
      
      const processed = await documentProcessor.processDocument(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      await pineconeService.upsertDocument(processed.chunks);

      logger.info('DocumentsRoutes', 'uploadDocument', 'Document uploaded successfully', {
        filename: processed.filename,
        chunks: processed.chunks.length
      });

      res.json({
        success: true,
        document: {
          filename: processed.filename,
          fileType: processed.fileType,
          fileSize: processed.fileSize,
          chunks: processed.chunks.length
        }
      });
    } catch (error) {
      logger.error('DocumentsRoutes', 'uploadDocument', 'Upload failed', error);
      res.status(500).json({ error: 'Failed to process document' });
    }
  });

  // Delete document endpoint
  app.delete("/api/admin/documents/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      await pineconeService.deleteDocument(filename);
      
      logger.info('DocumentsRoutes', 'deleteDocument', 'Document deleted', { filename });
      res.json({ success: true });
    } catch (error) {
      logger.error('DocumentsRoutes', 'deleteDocument', 'Delete failed', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  });

  // Search documents endpoint
  app.post("/api/admin/documents/search", async (req, res) => {
    try {
      const { query, topK = 5 } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      logger.info('DocumentsRoutes', 'searchDocuments', 'Searching documents', { 
        query: query.substring(0, 50),
        topK 
      });

      const results = await pineconeService.searchSimilar(query, topK);
      
      logger.info('DocumentsRoutes', 'searchDocuments', 'Search completed', { 
        resultCount: results.length 
      });

      res.json({
        results,
        query,
        topK,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('DocumentsRoutes', 'searchDocuments', 'Search failed', error);
      res.status(500).json({ error: 'Failed to search documents' });
    }
  });

  logger.info('DocumentsRoutes', 'init', 'Documents routes registered successfully');
}