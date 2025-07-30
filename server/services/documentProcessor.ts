import mammoth from 'mammoth';
import { DocumentChunk } from './pinecone';

export interface ProcessedDocument {
  filename: string;
  content: string;
  fileType: string;
  fileSize: number;
  chunks: DocumentChunk[];
}

export class DocumentProcessor {
  private readonly maxChunkSize = 1000; // Max characters per chunk
  private readonly chunkOverlap = 200; // Overlap between chunks

  async processDocument(buffer: Buffer, filename: string, mimetype: string): Promise<ProcessedDocument> {
    console.log(`[DocumentProcessor] Processing ${filename} (${mimetype})`);
    
    let content: string;
    let fileType: string;

    try {
      switch (mimetype) {
        case 'application/pdf':
          content = await this.processPDF(buffer);
          fileType = 'pdf';
          break;
        
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          content = await this.processDocx(buffer);
          fileType = 'docx';
          break;
        
        case 'text/plain':
          content = buffer.toString('utf-8');
          fileType = 'txt';
          break;
        
        default:
          throw new Error(`Unsupported file type: ${mimetype}`);
      }

      const chunks = this.createChunks(content, filename, fileType, buffer.length);
      
      console.log(`[DocumentProcessor] Created ${chunks.length} chunks for ${filename}`);
      
      return {
        filename,
        content,
        fileType,
        fileSize: buffer.length,
        chunks
      };
    } catch (error) {
      console.error(`[DocumentProcessor] Error processing ${filename}:`, error);
      throw error;
    }
  }

  private async processPDF(buffer: Buffer): Promise<string> {
    // Dynamic import to avoid module loading issues
    const pdf = await import('pdf-parse');
    const data = await pdf.default(buffer);
    return data.text;
  }

  private async processDocx(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  private createChunks(content: string, filename: string, fileType: string, fileSize: number): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const words = content.split(/\s+/);
    
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testChunk = currentChunk + (currentChunk ? ' ' : '') + word;
      
      if (testChunk.length > this.maxChunkSize && currentChunk.length > 0) {
        // Create chunk
        chunks.push({
          id: `${filename}-chunk-${chunkIndex}`,
          text: currentChunk.trim(),
          metadata: {
            filename,
            chunkIndex,
            totalChunks: 0, // Will be updated after all chunks are created
            uploadDate: new Date().toISOString(),
            fileType,
            fileSize
          }
        });
        
        // Start new chunk with overlap
        const overlapWords = this.getOverlapWords(currentChunk, this.chunkOverlap);
        currentChunk = overlapWords + ' ' + word;
        chunkIndex++;
      } else {
        currentChunk = testChunk;
      }
    }
    
    // Add final chunk if it has content
    if (currentChunk.trim().length > 0) {
      chunks.push({
        id: `${filename}-chunk-${chunkIndex}`,
        text: currentChunk.trim(),
        metadata: {
          filename,
          chunkIndex,
          totalChunks: 0,
          uploadDate: new Date().toISOString(),
          fileType,
          fileSize
        }
      });
    }
    
    // Update total chunks count
    const totalChunks = chunks.length;
    chunks.forEach(chunk => {
      chunk.metadata.totalChunks = totalChunks;
    });
    
    return chunks;
  }

  private getOverlapWords(text: string, maxOverlapChars: number): string {
    const words = text.split(/\s+/);
    let overlap = '';
    
    for (let i = words.length - 1; i >= 0; i--) {
      const testOverlap = words[i] + (overlap ? ' ' : '') + overlap;
      if (testOverlap.length > maxOverlapChars) {
        break;
      }
      overlap = testOverlap;
    }
    
    return overlap;
  }

  getSupportedTypes(): string[] {
    return [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
  }
}

export const documentProcessor = new DocumentProcessor();