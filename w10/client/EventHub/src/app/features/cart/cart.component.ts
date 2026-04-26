import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom, timeout, catchError, throwError } from 'rxjs';
import { CartService } from '../../core/cart';
import { Auth } from '../../core/auth';
import { ReservationService } from '../reservations/reservation.service';
import { PaymentService } from '../payments/payment.service';
import { TicketService } from '../tickets/ticket.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent {
  items: any[] = [];
  status: 'idle' | 'processing' | 'success' | 'error' = 'idle';
  progressMessage = '';
  purchasedTickets: string[] = [];
  errorMessage: string | null = null;

  constructor(
    private cart: CartService,
    private router: Router,
    private auth: Auth,
    private reservationService: ReservationService,
    private paymentService: PaymentService,
    private ticketService: TicketService,
    private cdr: ChangeDetectorRef
  ) {
    this.items = this.cart.getItems();
    this.cart.items$().subscribe((list) => (this.items = list));
  }

  remove(i: number) {
    this.cart.remove(i);
  }

  total() {
    return this.items.reduce((s, it) => s + (it.price || 0) * it.quantity, 0);
  }

  /** Update UI state and force Angular to re-render */
  private updateUI(status: typeof this.status, message: string, error?: string | null) {
    this.status = status;
    this.progressMessage = message;
    if (error !== undefined) this.errorMessage = error;
    this.cdr.detectChanges();
  }

  private apiCall<T>(label: string, obs$: import('rxjs').Observable<T>): Promise<T> {
    return firstValueFrom(
      obs$.pipe(
        timeout(15000),
        catchError((err) => {
          console.error(`[checkout] FAIL: ${label}`, err);
          return throwError(() => err);
        })
      )
    );
  }

  async checkout() {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/cart' } });
      return;
    }

    this.updateUI('processing', 'Starting checkout...', null);
    this.purchasedTickets = [];

    try {
      for (let i = 0; i < this.items.length; i++) {
        const item = this.items[i];

        for (let q = 0; q < (item.quantity || 1); q++) {
          const seat = (q === 0 && item.seat) ? item.seat : undefined;

          this.updateUI('processing', `Creating reservation for "${item.eventTitle}" (${q + 1}/${item.quantity})...`);
          const reservation = await this.apiCall(
            'createReservation',
            this.reservationService.createReservation(item.eventId, {
              ticket_type_id: item.ticketTypeId,
              seat
            })
          );

          this.updateUI('processing', `Processing payment for "${item.eventTitle}" (${q + 1}/${item.quantity})...`);
          const payment = await this.apiCall(
            'initiatePayment',
            this.paymentService.initiatePayment(reservation.reservation_id, {
              amount: Number(item.price || 0),
              method: 'card'
            })
          );

          this.updateUI('processing', 'Capturing payment...');
          await this.apiCall(
            'capturePayment',
            this.paymentService.capturePayment(payment.payment_id)
          );

          this.updateUI('processing', `Issuing ticket (${q + 1}/${item.quantity})...`);
          const ticket = await this.apiCall(
            'issueTicket',
            this.ticketService.issueTicket(reservation.reservation_id)
          );
          if (ticket?.ticket_id) this.purchasedTickets.push(ticket.ticket_id);
        }
      }

      this.cart.clear();
      this.updateUI('success', 'Purchase complete!');
    } catch (err: any) {
      this.updateUI(
        'error',
        'Checkout failed.',
        err?.error?.message || err?.error?.error || err?.message || 'Checkout failed. Please try again.'
      );
    }
  }
}
