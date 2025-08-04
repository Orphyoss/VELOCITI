import { useVelocitiStore } from '../stores/useVelocitiStore';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Robust fallback for host and port
    let host = window.location.host;
    
    // Handle undefined or empty host
    if (!host || host === 'undefined' || host.includes('undefined')) {
      host = 'localhost:5000'; // Use port 5000 to match server
    }
    
    const wsUrl = `${protocol}//${host}/ws`;
    
    console.log(`[WebSocket] Attempting to connect to: ${wsUrl}`);
    console.log(`[WebSocket] Debug info - protocol: ${protocol}, host: ${host}, full URL: ${wsUrl}`);
    
    try {
      // Add additional error checking for WebSocket construction
      if (!window.WebSocket) {
        throw new Error('WebSocket not supported by browser');
      }
      
      // Validate URL before creating WebSocket
      if (wsUrl.includes('undefined')) {
        throw new Error(`Invalid WebSocket URL contains undefined: ${wsUrl}`);
      }
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        useVelocitiStore.getState().setConnectionStatus(true);
        
        // Send ping to keep connection alive
        this.sendMessage({ type: 'ping' });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        useVelocitiStore.getState().setConnectionStatus(false);
        this.ws = null;
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error(`[WebSocket] Connection error to ${wsUrl}:`, error);
        useVelocitiStore.getState().setConnectionStatus(false);
      };

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private handleMessage(data: any) {
    const store = useVelocitiStore.getState();
    
    switch (data.type) {
      case 'new_alert':
        store.addAlert(data.data);
        break;
      
      case 'metrics_update':
        // Handle metrics update
        break;
      
      case 'agent_status':
        store.updateAgent(data.data.agentId, { status: data.data.status });
        break;
      
      case 'initial_data':
        if (data.alerts) {
          store.setAlerts(data.alerts);
        }
        break;
      
      case 'pong':
        // Keep-alive response
        break;
      
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[WebSocket] Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      // Exponential backoff with max delay of 10 seconds
      const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 10000);
      
      setTimeout(() => {
        try {
          if (this.reconnectAttempts <= this.maxReconnectAttempts) {
            this.connect();
          }
        } catch (error) {
          console.error('[WebSocket] Reconnection attempt failed:', error);
          // Continue trying with next attempt if within limits
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        }
      }, delay);
    } else {
      console.log('[WebSocket] Max reconnection attempts reached. Disabling automatic reconnection.');
      useVelocitiStore.getState().setConnectionStatus(false);
    }
  }

  sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  subscribe(channel: string) {
    this.sendMessage({ type: 'subscribe', channel });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsService = new WebSocketService();
