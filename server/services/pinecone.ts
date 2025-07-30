import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

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
          console.log(`[Pinecone] Using existing index: ${this.indexName}`);
        } else {
          console.log(`[Pinecone] Creating index: ${this.indexName}`);
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
      console.log(`[Pinecone] Connected to index: ${this.indexName}`);
    } catch (error) {
      console.error('[Pinecone] Initialization error:', error);
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
          console.log(`[Pinecone] Index not ready, waiting... (${attempts + 1}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        }
      } catch (error) {
        console.log(`[Pinecone] Waiting for index creation... (${attempts + 1}/${maxAttempts})`);
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
      console.error('[Pinecone] Embedding generation error:', error);
      // Fallback to ada-002 and truncate
      try {
        const fallbackResponse = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: text,
        });
        return fallbackResponse.data[0].embedding.slice(0, 1024);
      } catch (fallbackError) {
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
      console.log(`[Pinecone] Upserted ${vectors.length} vectors for ${chunks[0]?.metadata.filename}`);
    } catch (error) {
      console.error('[Pinecone] Upsert error:', error);
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
      console.error('[Pinecone] Search error:', error);
      throw error;
    }
  }

  async deleteDocument(filename: string): Promise<void> {
    try {
      // Delete all vectors for this document
      await this.index.deleteMany({
        filter: { filename }
      });
      console.log(`[Pinecone] Deleted vectors for ${filename}`);
    } catch (error) {
      console.error('[Pinecone] Delete error:', error);
      throw error;
    }
  }

  async getIndexStats(): Promise<any> {
    try {
      const stats = await this.index.describeIndexStats();
      return stats;
    } catch (error) {
      console.error('[Pinecone] Stats error:', error);
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
      console.error('[Pinecone] List documents error:', error);
      return [];
    }
  }
}

export const pineconeService = new PineconeService();