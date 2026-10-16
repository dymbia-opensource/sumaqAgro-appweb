import { DestroyRef, inject, Injectable, signal } from '@angular/core';

/**
 * Tells whether the device is connected, and when it gets the connection back.
 *
 * @remarks
 * In the field the producer often has no signal. Field Management uses this
 * service to keep the expenses on the device and send them later.
 */
@Injectable({ providedIn: 'root' })
export class NetworkStatus {
  private readonly onlineSignal = signal(typeof navigator === 'undefined' ? true : navigator.onLine);

  /** `true` while the device has connection. */
  readonly online = this.onlineSignal.asReadonly();

  constructor() {
    if (typeof window === 'undefined') return;
    const update = () => this.onlineSignal.set(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    });
  }
}
