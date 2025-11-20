// A tiny EventEmitter-compatible base class that you can reuse
type EventMap = Record<string, unknown>;
type EventListener<T> = (data: T) => void;

export class TypedEventEmitter<E extends EventMap> {
  private listeners = new Map<keyof E, Set<EventListener<unknown>>>();

  public on<K extends keyof E>(type: K, listener: EventListener<E[K]>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    const eventListeners = this.listeners.get(type);
    if (eventListeners) {
      eventListeners.add(listener as EventListener<unknown>);
    }
    return () => this.off(type, listener); // handy disposer
  }

  public off<K extends keyof E>(type: K, listener: EventListener<E[K]>): void {
    const eventListeners = this.listeners.get(type);
    if (eventListeners) {
      eventListeners.delete(listener as EventListener<unknown>);
      if (eventListeners.size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  public removeListener<K extends keyof E>(type: K, listener: EventListener<E[K]>): void {
    this.off(type, listener);
  }

  public emit<K extends keyof E>(type: K, data: E[K]): boolean {
    const eventListeners = this.listeners.get(type);
    if (eventListeners && eventListeners.size > 0) {
      // Call each listener with the data directly (EventEmitter style)
      eventListeners.forEach((listener) => {
        try {
          (listener as EventListener<E[K]>)(data);
        } catch (error) {
          // In Node.js EventEmitter, errors in listeners don't stop other listeners
          // We'll just log and continue
          console.error(`Error in event listener for '${String(type)}':`, error);
        }
      });
      return true;
    }
    return false;
  }

  public removeAllListeners<K extends keyof E>(type?: K): void {
    if (type !== undefined) {
      this.listeners.delete(type);
    } else {
      this.listeners.clear();
    }
  }
}
