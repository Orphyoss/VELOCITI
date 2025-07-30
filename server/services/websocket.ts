import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { db } from './supabase';
import { alerts, systemMetrics } from '@shared/schema';
import { desc } from 'drizzle-orm';

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket connection established');
      this.clients.add(ws);

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message);
          await this.handleMessage(ws, data);
        } catch (error) {
          console.error('WebSocket message error:', error);
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
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
        console.log('Unknown message type:', data.type);
    }
  }

  private async sendInitialData(ws: WebSocket) {
    try {
      // Send recent alerts
      const recentAlerts = await db.select()
        .from(alerts)
        .orderBy(desc(alerts.createdAt))
        .limit(10);

      ws.send(JSON.stringify({
        type: 'initial_data',
        alerts: recentAlerts
      }));

    } catch (error) {
      console.error('Error sending initial data:', error);
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
