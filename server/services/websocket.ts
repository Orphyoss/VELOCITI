import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from '../storage';
import { logger } from './logger';

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket) => {
      logger.info('WebSocket', 'setupWebSocket', 'New connection established', { clientCount: this.clients.size + 1 });
      this.clients.add(ws);

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message);
          await this.handleMessage(ws, data);
        } catch (error) {
          logger.error('WebSocket', 'handleMessage', 'Message parsing failed', error, { rawMessage: message });
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        logger.info('WebSocket', 'onClose', 'Connection closed', { remainingClients: this.clients.size - 1 });
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        logger.error('WebSocket', 'onError', 'Connection error occurred', error);
        this.clients.delete(ws);
      });

      // Send initial data
      this.sendInitialData(ws);
    });
  }

  private async handleMessage(ws: WebSocket, data: any) {
    switch (data.type) {
      case 'subscribe':
        // Handle subscription to specific data streams
        ws.send(JSON.stringify({ 
          type: 'subscribed', 
          channel: data.channel 
        }));
        break;
      
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      
      default:
        logger.warn('WebSocket', 'handleMessage', 'Unknown message type received', { messageType: data.type, data });
    }
  }

  private async sendInitialData(ws: WebSocket) {
    try {
      // Send recent alerts using storage interface
      const recentAlerts = await storage.getAlerts(10);

      ws.send(JSON.stringify({
        type: 'initial_data',
        alerts: recentAlerts
      }));

    } catch (error) {
      logger.error('WebSocket', 'sendInitialData', 'Failed to send initial data', error);
    }
  }

  // Broadcast new alert to all connected clients
  broadcastAlert(alert: any) {
    const message = JSON.stringify({
      type: 'new_alert',
      data: alert
    });

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Broadcast system metrics update
  broadcastMetrics(metrics: any) {
    const message = JSON.stringify({
      type: 'metrics_update',
      data: metrics
    });

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Broadcast agent status change
  broadcastAgentStatus(agentId: string, status: string) {
    const message = JSON.stringify({
      type: 'agent_status',
      data: { agentId, status }
    });

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}
