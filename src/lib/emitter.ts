type Obj = Record<string,any>

type Callback <EventData = Obj> = (data?: EventData) => void
type AnyCallback <Events> = (event: keyof Events, data?: Events[keyof Events]) => void

export interface Emitter <Events extends Obj = Obj> {
  emit: <Event extends keyof Events> (event: Event, data?: Events[Event]) => void
  on: <Event extends keyof Events> (event: Event, cb: Callback<Events[Event]>) => void
  off: <Event extends keyof Events> (event: Event, cb: Callback<Events[Event]>) => void
  onAny: (cb: AnyCallback<Events>) => void
  offAny: (cb: AnyCallback<Events>) => void
  reset: <Event extends keyof Events> (event?: Event) => void
}

export const emitter = <Events extends Obj = Obj> (): Emitter<Events> => {
  type TypedEmitter = Emitter<Events>

  const callbacks: Partial<Record<keyof Events, (Callback<Events[any]>)[]>> = {};
  const anyCallbacks: AnyCallback<Events>[] = [];

  const emit: TypedEmitter['emit'] = (event, data) => {
    if (callbacks[event]) {
      callbacks[event].map(callback => callback(data))
    }
    anyCallbacks.map(callback => callback(event, data));
  }

  const on: TypedEmitter['on'] = (event, callback) => {
    if (!callbacks[event]) {
      callbacks[event] = [];
    }
    callbacks[event].push(callback);
  }

  const off: TypedEmitter['off'] = (event, callback) => {
    callbacks[event].splice(callbacks[event].indexOf(callback), 1);
  }

  const onAny: TypedEmitter['onAny'] = callback => {
    anyCallbacks.push(callback);
  }

  const offAny: TypedEmitter['offAny'] = callback => {
    anyCallbacks.splice(anyCallbacks.indexOf(callback), 1);
  }

  const reset: TypedEmitter['reset'] = event => {
    if (event) {
      delete callbacks[event];
    } else {
      for (const key of Object.keys(callbacks)) {
        delete callbacks[key];
      }
      anyCallbacks.splice(0, anyCallbacks.length);
    }
  }

  return {
    emit, on, off, onAny, offAny, reset
  };
}
