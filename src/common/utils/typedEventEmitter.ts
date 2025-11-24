// A tiny typed event emitter
type EventMap = Record<string, unknown>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Listener = (data: any) => void;

export class TypedEventEmitter<E extends EventMap> {
  private listeners = new Map<keyof E, Set<Listener>>();

  public on<K extends keyof E>(type: K, listener: (data: E[K]) => void): () => void {
    let listeners = this.listeners.get(type);
    if (!listeners) {
      listeners = new Set();
      this.listeners.set(type, listeners);
    }
    listeners.add(listener);
    return () => this.off(type, listener);
  }

  public once<K extends keyof E>(type: K, listener: (data: E[K]) => void): () => void {
    const wrappedListener = (data: E[K]) => {
      this.off(type, wrappedListener);
      listener(data);
    };
    return this.on(type, wrappedListener);
  }

  public off<K extends keyof E>(type: K, listener: (data: E[K]) => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  public removeListener<K extends keyof E>(type: K, listener: (data: E[K]) => void): void {
    this.off(type, listener);
  }

  public emit<K extends keyof E>(type: K, data: E[K]): void {
    this.listeners.get(type)?.forEach((fn) => fn(data));
  }
}
