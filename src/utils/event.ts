export class EventChanel<T> {
  events = new Set<(context: T) => void>();
  subscribe(cb: (context: T) => void) {
    this.events.add(cb);
    return () => {
      this.events.delete(cb);
    };
  }
  emit(context?: T) {
    this.events.forEach((cb) => cb(context as T));
  }
}
