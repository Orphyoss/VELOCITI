import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import { logger } from './logger';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface DocumentChunk {
  id: string;
  text: string;
  metadata: {
    filename: string;
    chunkIndex: number;
    totalChunks: number;
    uploadDate: string;
    fileType: string;
    fileSize: number;
  };
}

export interface SearchResult {
  id: string;
  text: string;
  score: number;
  metadata: DocumentChunk['metadata'];
}

export class PineconeService {
  private indexName = 'velociti'; // Use the updated index name
  private index: any;

  constructor() {
    this.initializeIndex();
  }

  private async initializeIndex() {
    try {
      // Check if index exists, create if not
      const indexList = await pinecone.listIndexes();
      const indexExists = indexList.indexes?.some(index => index.name === this.indexName);

      if (!indexExists) {
        // Try to use any existing index first
        const existingIndexes = indexList.indexes?.filter(index => 
          index.spec?.serverless && (index.dimension === 1536 || index.dimension === 1024)
        );
        
        if (existingIndexes && existingIndexes.length > 0) {
          this.indexName = existingIndexes[0].name!;
          logger.info('Pinecone', 'initializeIndex', 'Using existing index', { indexName: this.indexName });
        } else {
          logger.info('Pinecone', 'initializeIndex', 'Creating new index', { indexName: this.indexName });
          await pinecone.createIndex({
            name: this.indexName,
            dimension: 1024, // Match existing index dimension
            metric: 'cosine',
            spec: {
              serverless: {
                cloud: 'aws',
                region: 'us-east-1'
              }
            }
          });

          // Wait for index to be ready
          await this.waitForIndexReady();
        }
      }

      this.index = pinecone.index(this.indexName);
      logger.info('Pinecone', 'initializeIndex', 'Successfully connected to index', { indexName: this.indexName });
    } catch (error) {
      logger.error('Pinecone', 'initializeIndex', 'Initialization failed', error);
      throw error;
    }
  }

  private async waitForIndexReady() {
    let isReady = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!isReady && attempts < maxAttempts) {
      try {
        const indexStats = await pinecone.describeIndex(this.indexName);
        isReady = indexStats.status?.ready === true;
        
        if (!isReady) {
          logger.debug('Pinecone', 'waitForIndexReady', 'Index not ready, waiting...', { attempt: attempts + 1, maxAttempts });
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        }
      } catch (error) {
        logger.debug('Pinecone', 'waitForIndexReady', 'Waiting for index creation...', { attempt: attempts + 1, maxAttempts });
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      attempts++;
    }

    if (!isReady) {
      throw new Error('Index creation timeout');
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Use text-embedding-3-small with 1024 dimensions to match index
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        dimensions: 1024,
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.warn('Pinecone', 'generateEmbedding', 'Embedding generation failed, trying fallback', error);
      // Fallback to ada-002 and truncate
      try {
        const fallbackResponse = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: text,
        });
        logger.debug('Pinecone', 'generateEmbedding', 'Using fallback embedding model (ada-002)');
        return fallbackResponse.data[0].embedding.slice(0, 1024);
      } catch (fallbackError) {
        logger.error('Pinecone', 'generateEmbedding', 'Both primary and fallback embedding models failed', fallbackError);
        throw error;
      }
    }
  }

  async upsertDocument(chunks: DocumentChunk[]): Promise<void> {
    try {
      const vectors = [];

      for (const chunk of chunks) {
        const embedding = await this.generateEmbedding(chunk.text);
        vectors.push({
          id: chunk.id,
          values: embedding,
          metadata: {
            text: chunk.text,
            ...chunk.metadata
          }
        });
      }

      await this.index.upsert(vectors);
      logger.info('Pinecone', 'upsertDocument', 'Successfully upserted vectors', { 
        vectorCount: vectors.length, 
        filename: chunks[0]?.metadata.filename 
      });
    } catch (error) {
      logger.error('Pinecone', 'upsertDocument', 'Failed to upsert vectors', error, { 
        chunkCount: chunks.length, 
        filename: chunks[0]?.metadata.filename 
      });
      throw error;
    }
  }

  async searchSimilar(query: string, topK: number = 5): Promise<SearchResult[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      
      const searchResponse = await this.index.query({
        vector: queryEmbedding,
        topK,
        includeValues: false,
        includeMetadata: true,
      });

      return searchResponse.matches?.map((match: any) => ({
        id: match.id,
        text: match.metadata.text,
        score: match.score,
        metadata: {
          filename: match.metadata.filename,
          chunkIndex: match.metadata.chunkIndex,
          totalChunks: match.metadata.totalChunks,
          uploadDate: match.metadata.uploadDate,
          fileType: match.metadata.fileType,
          fileSize: match.metadata.fileSize,
        }
      })) || [];
    } catch (error) {
      logger.error('Pinecone', 'searchSimilar', 'Vector search failed', error, { query, topK });
      throw error;
    }
  }

  async deleteDocument(filename: string): Promise<void> {
    try {
      logger.info('Pinecone', 'deleteDocument', 'Starting document deletion', { filename });
      
      // First, find all vectors by querying without filters
      const dummyVector = new Array(1024).fill(0);
      const queryResponse = await this.index.query({
        vector: dummyVector,
        topK: 10000,
        includeMetadata: true,
        includeValues: false
      });

      logger.debug('Pinecone', 'deleteDocument', 'Retrieved vectors for deletion scan', { 
        totalVectors: queryResponse.matches?.length 
      });

      // Filter vectors that match the filename on client side
      const matchingVectorIds: string[] = [];
      queryResponse.matches?.forEach((match: any) => {
        if (match.metadata?.filename === filename) {
          matchingVectorIds.push(match.id);
        }
      });
      
      logger.info('Pinecone', 'deleteDocument', 'Found matching vectors for deletion', { 
        filename, 
        matchingVectorCount: matchingVectorIds.length 
      });
      
      if (matchingVectorIds.length > 0) {
        // Delete vectors by their IDs - use the deleteMany with array of IDs
        for (const id of matchingVectorIds) {
          await this.index.deleteOne(id);
        }
        logger.info('Pinecone', 'deleteDocument', 'Successfully deleted vectors', { 
          filename, 
          deletedCount: matchingVectorIds.length 
        });
      } else {
        logger.info('Pinecone', 'deleteDocument', 'No vectors found for deletion', { filename });
      }
    } catch (error) {
      logger.error('Pinecone', 'deleteDocument', 'Document deletion failed', error, { filename });
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  async getIndexStats(): Promise<any> {
    try {
      const stats = await this.index.describeIndexStats();
      return stats;
    } catch (error) {
      logger.error('Pinecone', 'getIndexStats', 'Failed to get index statistics', error);
      throw error;
    }
  }

  async listDocuments(): Promise<Array<{filename: string, chunkCount: number, uploadDate: string, fileType: string}>> {
    try {
      // Query to get all unique documents with correct dimension
      const emptyVector = new Array(1024).fill(0);
      const response = await this.index.query({
        vector: emptyVector,
        topK: 10000,
        includeMetadata: true,
        includeValues: false
      });

      const documentMap = new Map();
      
      response.matches?.forEach((match: any) => {
        const filename = match.metadata.filename;
        if (!documentMap.has(filename)) {
          documentMap.set(filename, {
            filename,
            chunkCount: 0,
            uploadDate: match.metadata.uploadDate,
            fileType: match.metadata.fileType
          });
        }
        documentMap.get(filename).chunkCount++;
      });

      return Array.from(documentMap.values());
    } catch (error) {
      logger.error('Pinecone', 'listDocuments', 'Failed to list documents', error);
      return [];
    }
  }
}

export const pineconeService = new PineconeService();