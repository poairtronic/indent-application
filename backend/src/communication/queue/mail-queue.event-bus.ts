import { EventEmitter } from 'events';

export interface IMailQueueWakeupEvent {
  jobId?: string;
  delayMs?: number;
}

export class MailQueueEventBus extends EventEmitter {
  public emitWakeup(event: IMailQueueWakeupEvent = {}): boolean {
    return this.emit('job:enqueued', event);
  }

  public onWakeup(listener: (event: IMailQueueWakeupEvent) => void): this {
    return this.on('job:enqueued', listener);
  }

  public offWakeup(listener: (event: IMailQueueWakeupEvent) => void): this {
    return this.off('job:enqueued', listener);
  }
}

export const mailQueueEventBus = new MailQueueEventBus();
mailQueueEventBus.setMaxListeners(50);
