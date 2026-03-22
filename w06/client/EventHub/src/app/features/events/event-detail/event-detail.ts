import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService, EventDto } from '../event.service';
import { CartService } from '../../../core/cart';
import { Auth } from '../../../core/auth';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-detail.html',
  styleUrls: ['./event-detail.scss'],
})
export class EventDetail {
  event$!: Observable<EventDto | null>;
  error: string | null = null;

  // selection state
  selectedTicketTypeId: string | null = null;
  quantity = 1;
  selectedSeat: string | null = null;
  buyerName: string | null = null;
  buyerEmail: string | null = null;
  paymentMethod: string = 'card';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: EventService,
    private cart: CartService,
    private auth: Auth
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Missing event id';
      this.event$ = of(null);
      return;
    }
    this.event$ = this.svc.getEvent(id).pipe(catchError((_) => of(null)));
    // derive ticket types observable from event
    this.ticketTypes$ = this.event$.pipe(map((e) => this._ticketTypesFromEvent(e)));
  }

  ticketTypes$!: Observable<{ id: string; name: string; price: number }[]>;

  private _ticketTypesFromEvent(event?: EventDto | null): { id: string; name: string; price: number }[] {
    const meta: any = (event && event.metadata) || {};
    if (Array.isArray(meta.ticketTypes) && meta.ticketTypes.length > 0) {
      return meta.ticketTypes.map((t: any) => ({ id: String(t.id), name: t.name, price: Number(t.price || 0) }));
    }
    return [
      { id: 'general', name: 'General Admission', price: 10 },
      { id: 'vip', name: 'VIP', price: 30 },
    ];
  }

  addToCart(event?: EventDto | null) {
    if (!event) return;
    const types = this._ticketTypesFromEvent(event);
    const t = types.find((x: { id: string; name: string; price: number }) => x.id === this.selectedTicketTypeId) || types[0];
    this.cart.add({
      eventId: event.event_id,
      eventTitle: event.title,
      ticketTypeId: t.id,
      ticketTypeName: t.name,
      price: t.price,
      quantity: this.quantity || 1,
      seat: this.selectedSeat || null,
      buyerName: this.buyerName || null,
      buyerEmail: this.buyerEmail || null,
    });
    // navigate to cart or show a toast — for now navigate to /cart (not implemented yet)
    this.router.navigate(['/cart']);
  }

  // no manual subscriptions to clean up (using observables + async pipe)

  isAuthenticated(): boolean {
    return !!this.auth && this.auth.isAuthenticated();
  }
}
