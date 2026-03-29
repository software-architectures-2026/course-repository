import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService, EventDto } from '../event.service';
import { TicketTypeService, TicketTypeDto } from '../ticket-type.service';
import { Observable, of } from 'rxjs';
import { CartService } from '../../../core/cart';
import { Auth } from '../../../core/auth';
import { map, catchError, tap } from 'rxjs/operators';

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
  private loadedTicketTypes: TicketTypeDto[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: EventService,
    private ticketTypeService: TicketTypeService,
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
    // derive ticket types observable from API and cache results
    this.ticketTypes$ = this.ticketTypeService.listByEvent(id).pipe(
      tap((types) => (this.loadedTicketTypes = types)),
      catchError(() => of([] as TicketTypeDto[]))
    );
  }

  ticketTypes$!: Observable<TicketTypeDto[]>;

  addToCart(event?: EventDto | null) {
    if (!event) return;
    const types = this.loadedTicketTypes;
    const t = types.find((x) => x.ticket_type_id === this.selectedTicketTypeId) || types[0];
    if (!t) return;

    this.cart.add({
      eventId: event.event_id,
      eventTitle: event.title,
      ticketTypeId: t.ticket_type_id,
      ticketTypeName: t.name,
      price: Number(t.price || 0),
      quantity: this.quantity || 1,
      seat: this.selectedSeat || null,
      buyerName: this.buyerName || null,
      buyerEmail: this.buyerEmail || null,
    });

    this.router.navigate(['/cart']);
  }

  // no manual subscriptions to clean up (using observables + async pipe)

  isAuthenticated(): boolean {
    return !!this.auth && this.auth.isAuthenticated();
  }
}
