// A tiny EventTarget-based base class you can reuse
type EventMap = Record<string, any>;

export class TypedEventTarget<E extends EventMap> extends EventTarget {
  public on<K extends keyof E>(type: K, listener: (ev: CustomEvent<E[K]>) => void, opts?: AddEventListenerOptions) {
    this.addEventListener(type as string, listener as EventListener, opts);
    return () => this.off(type, listener); // handy disposer
  }
  public off<K extends keyof E>(type: K, listener: (ev: CustomEvent<E[K]>) => void, opts?: EventListenerOptions) {
    this.removeEventListener(type as string, listener as EventListener, opts);
  }
  public emit<K extends keyof E>(type: K, detail: E[K]) {
    return this.dispatchEvent(new CustomEvent(String(type), { detail }));
  }
}
