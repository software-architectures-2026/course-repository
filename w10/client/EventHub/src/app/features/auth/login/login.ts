import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Auth } from '../../../core/auth';
import { NotificationService } from '../../../core/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private notification = inject(NotificationService);

  private subs: Subscription[] = [];

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  loading = false;
  error: string | null = null;

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = null;
    const { email, password } = this.form.value as { email: string; password: string };
    this.auth.login({ email, password }).subscribe({
      next: () => {
        this.loading = false;
        const returnUrl = this.activatedRoute.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl || '/events');
      },
      error: (err) => {
        this.loading = false;
        this.handleServerError(err);
      },
    });
  }

  constructor() {
    // Clear server-side errors when user edits fields
    Object.keys(this.form.controls).forEach(name => {
      const ctrl = this.form.get(name)!;
      const s = ctrl.valueChanges.subscribe(() => {
        this.clearControlServerError(ctrl);
        this.error = null;
      });
      this.subs.push(s);
    });
  }

  private handleServerError(err: any) {
    const body = err?.error || {};
    const code = body.code;
    const message = body.message || err?.message || 'Login failed';

    if (code === 'VALIDATION_ERROR') {
      const details: Array<{ field?: string; issue?: string }> = body.details || [];
      if (details.length) {
        this.applyFieldErrors(details);
        // also show a non-intrusive toast so the user notices there were server-side validation issues
        this.notification.showWarn(message);
        return;
      }
      // no field-level details -> show form-level
      this.error = message;
      this.notification.showWarn(message);
      return;
    }

    // Authentication-specific feedback
    if (code === 'AUTHENTICATION_FAILED' || code === 'AUTHENTICATION_ERROR' || err?.status === 401) {
      this.error = message;
      this.notification.showWarn(message);
      return;
    }

    // Fallback: show message and notify
    this.error = message;
    this.notification.showError(message);
  }

  private applyFieldErrors(details: Array<{ field?: string; issue?: string }>) {
    details.forEach(d => {
      if (!d.field) return;
      const ctrl = this.form.get(d.field);
      if (ctrl) {
        const current = ctrl.errors ? { ...ctrl.errors } : null;
        const next = { ...(current || {}), server: d.issue || 'Invalid' };
        ctrl.setErrors(next);
        ctrl.markAsTouched();
      } else {
        const issue = d.issue || 'Invalid';
        this.error = this.error ? `${this.error}; ${issue}` : issue;
      }
    });
  }

  private clearControlServerError(ctrl: any) {
    const errs = ctrl.errors;
    if (!errs) return;
    if (errs.server) {
      const copy = { ...errs };
      delete copy.server;
      const hasOther = Object.keys(copy).length > 0;
      ctrl.setErrors(hasOther ? copy : null);
    }
  }
}
