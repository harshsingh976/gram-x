/**
 * GRAM-X Network Status Monitor
 * Detects online, weak connection, and offline states for rural resilience.
 */

export type NetworkStatusType = 'ONLINE' | 'WEAK_CONNECTION' | 'OFFLINE';

export type NetworkChangeListener = (status: NetworkStatusType) => void;

class NetworkService {
  private listeners: Set<NetworkChangeListener> = new Set();
  private currentStatus: NetworkStatusType = 'ONLINE';

  constructor() {
    if (typeof window !== 'undefined') {
      this.currentStatus = navigator.onLine ? 'ONLINE' : 'OFFLINE';

      window.addEventListener('online', () => this.evaluateConnection());
      window.addEventListener('offline', () => this.updateStatus('OFFLINE'));

      // Check effective connection type if available
      if ('connection' in navigator) {
        const conn = (navigator as any).connection;
        if (conn) {
          conn.addEventListener('change', () => this.evaluateConnection());
        }
      }
    }
  }

  private evaluateConnection() {
    if (!navigator.onLine) {
      this.updateStatus('OFFLINE');
      return;
    }

    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn && (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g' || conn.rtt > 1500)) {
        this.updateStatus('WEAK_CONNECTION');
        return;
      }
    }

    this.updateStatus('ONLINE');
  }

  private updateStatus(status: NetworkStatusType) {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      this.listeners.forEach((listener) => listener(status));
    }
  }

  public getStatus(): NetworkStatusType {
    return this.currentStatus;
  }

  public isOnline(): boolean {
    return this.currentStatus !== 'OFFLINE';
  }

  public subscribe(listener: NetworkChangeListener): () => void {
    this.listeners.add(listener);
    listener(this.currentStatus);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const networkService = new NetworkService();
export default networkService;
