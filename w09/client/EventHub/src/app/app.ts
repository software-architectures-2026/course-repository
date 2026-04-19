import { Component, signal, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/navbar';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from './core/notification.service';

interface Toast {
  id: string;
  type: Notification['type'];
  message: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnDestroy {
  protected readonly title = signal('EventHub');

  toasts: Toast[] = [];
  private timers = new Map<string, any>();

  constructor(private notification: NotificationService, private cd: ChangeDetectorRef) {
    this.notification.messages$.subscribe((m: Notification) => this.showToast(m));
  }

  private showToast(m: Notification) {
    console.log('showToast', m.message);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const t: Toast = { id, type: m.type, message: m.message };
    this.toasts.push(t);
    const timer = setTimeout(() => this.removeToast(id), 5000);
    this.timers.set(id, timer);
    this.cd.detectChanges();
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer);
    this.timers.delete(id);
    this.cd.detectChanges();
  }

  ngOnDestroy() {
    this.timers.forEach(t => clearTimeout(t));
    this.timers.clear();
  }
}
