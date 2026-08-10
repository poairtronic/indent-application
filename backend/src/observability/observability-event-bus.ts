import { EventEmitter } from 'events';

export const observabilityEventBus = new EventEmitter();
observabilityEventBus.setMaxListeners(20);
