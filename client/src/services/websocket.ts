import { useVelocitiStore } from '../stores/useVelocitiStore';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect() {
    // Graceful connection handling - don't block UI if WebSocket fails
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      // Robust fallback for host and port
      let host = window.location.host;
      
      // Handle undefined or empty host
      if (!host || host === 'undefined' || host.includes('undefined')) {
        console.warn('[WebSocket] Invalid host detected, skipping WebSocket connection');
        return; // Don't attempt connection with invalid host
      }
      
      const wsUrl = `${protocol}//${host}/ws`;
      
      console.log(`[WebSocket] Attempting to connect to: ${wsUrl}`);
      
      // Add additional error checking for WebSocket construction
      if (!window.WebSocket) {
        console.warn('[WebSocket] WebSocket not supported by browser');
        return;
      }
      
      // Validate URL before creating WebSocket
      if (wsUrl.includes('undefined')) {
        console.warn(`[WebSocket] Invalid WebSocket URL contains undefined: ${wsUrl}`);
        return;
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
          console.error('[WebSocket] Error parsing message:', error);
          // Don't let parsing errors crash the connection
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        useVelocitiStore.getState().setConnectionStatus(false);
        this.ws = null;
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.warn(`[WebSocket] Connection error (non-blocking):`, error);
        useVelocitiStore.getState().setConnectionStatus(false);
        
        // Prevent unhandled promise rejection - handle gracefully
        if (error instanceof Event && error.type === 'error') {
          console.log('[WebSocket] Handled WebSocket error event gracefully');
        }
      };

    } catch (error) {
      console.warn('[WebSocket] Failed to connect (non-blocking):', error);
      // Don't attempt reconnect immediately on failed construction
      useVelocitiStore.getState().setConnectionStatus(false);
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
      console.log(`[WebSocket] Attempting to reconnect (non-blocking)... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      // Exponential backoff with max delay of 30 seconds
      const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
      
      setTimeout(() => {
        try {
          if (this.reconnectAttempts <= this.maxReconnectAttempts) {
            this.connect();
          }
        } catch (error) {
          console.warn('[WebSocket] Reconnection attempt failed (non-blocking):', error);
          // Continue gracefully - don't crash the app
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
    try {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      } else {
        console.warn('[WebSocket] Cannot send message - connection not open');
      }
    } catch (error) {
      console.error('[WebSocket] Error sending message:', error);
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
