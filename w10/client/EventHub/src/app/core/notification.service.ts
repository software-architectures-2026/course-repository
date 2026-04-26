import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type Notification = { type: 'info' | 'warn' | 'error'; message: string };

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private subject = new Subject<Notification>();
  public messages$ = this.subject.asObservable();

  showInfo(message: string) {
    this.subject.next({ type: 'info', message });
    console.info('INFO: ' + message);
  }

  showWarn(message: string) {
    this.subject.next({ type: 'warn', message });
    console.warn('WARN: ' + message);
  }

  showError(message: string) {
    this.subject.next({ type: 'error', message });
    console.error('ERROR: ' + message);
  }
}
