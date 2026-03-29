import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
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
  progressMessage: string = '';
  purchasedTickets: string[] = [];
  errorMessage: string | null = null;

  constructor(private cart: CartService, private router: Router, private auth: Auth, private reservationService: ReservationService, private paymentService: PaymentService, private ticketService: TicketService) {
    // initialize after cart is injected
    this.items = this.cart.getItems();
    this.cart.items$().subscribe((list) => (this.items = list));
  }

  remove(i: number) {
    this.cart.remove(i);
  }

  total() {
    return this.items.reduce((s, it) => s + (it.price || 0) * it.quantity, 0);
  }

  async checkout() {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/cart' } });
      return;
    }

    this.status = 'processing';
    this.progressMessage = 'Starting checkout...';
    this.purchasedTickets = [];
    this.errorMessage = null;

    try {
      for (let i = 0; i < this.items.length; i++) {
        const item = this.items[i];
        for (let q = 0; q < (item.quantity || 1); q++) {
          this.progressMessage = `Creating reservation for "${item.eventTitle}" (${q + 1}/${item.quantity})...`;
          const seat = (q === 0 && item.seat) ? item.seat : undefined;
          const reservation = await firstValueFrom(this.reservationService.createReservation(item.eventId, {
            ticket_type_id: item.ticketTypeId,
            seat
          }));

          this.progressMessage = `Initiating payment for ${item.eventTitle}...`;
          const payment = await firstValueFrom(this.paymentService.initiatePayment(reservation.reservation_id, { amount: Number(item.price || 0), method: 'card' }));

          this.progressMessage = `Capturing payment...`;
          await firstValueFrom(this.paymentService.capturePayment(payment.payment_id));

          this.progressMessage = `Issuing ticket...`;
          const ticket = await firstValueFrom(this.ticketService.issueTicket(reservation.reservation_id));
          if (ticket && ticket.ticket_id) this.purchasedTickets.push(ticket.ticket_id);
        }
      }

      this.status = 'success';
      this.progressMessage = 'Purchase complete!';
      this.cart.clear();
    } catch (err: any) {
      this.status = 'error';
      this.errorMessage = err?.error?.message || err?.error?.error || err?.message || 'Checkout failed. Please try again.';
      this.progressMessage = 'Checkout failed.';
    }
  }
}
