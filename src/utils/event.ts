export class EventChanel<T> {
  events = new Set<(context: T) => void>();
  subscribe(cb: (context: T) => void) {
    this.events.add(cb);
    return () => {
      this.events.delete(cb);
    };
  }
  once(cb: (context: T) => void) {
    const clear = this.subscribe(cb);
    this.events.add(clear);
    return clear;
  }
  emit(context?: T) {
    this.events.forEach((cb) => cb(context as T));
  }
}
