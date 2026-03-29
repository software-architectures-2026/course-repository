import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TicketService, TicketDto } from '../ticket.service';
import { TicketTypeService, TicketTypeDto } from '../../events/ticket-type.service';
import { EventService } from '../../events/event.service';
import { Auth } from '../../../core/auth';
import { firstValueFrom, filter } from 'rxjs';

interface TicketViewModel {
  ticket: TicketDto;
  eventTitle: string;
  ticketTypeName: string;
  price: number;
  eventId: string;
}

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ticket-list.html',
  styleUrls: ['./ticket-list.scss'],
})
export class TicketList implements OnInit {
  items: TicketViewModel[] = [];
  loading = false;
  constructor(
    private ticketService: TicketService,
    private ticketTypeService: TicketTypeService,
    private eventService: EventService,
    private auth: Auth,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    this.loading = true;

    try {
      // Wait for a non-null user from the auth observable instead of
      // reading synchronously. This avoids the race condition where
      // getUser() returns null right after navigation.
      const user = await firstValueFrom(
        this.auth.user$().pipe(filter((u) => !!u))
      );

      if (!user) {
        this.items = [];
        return;
      }

      const tickets = await firstValueFrom(this.ticketService.listMyTickets(user.user_id));

      // Batch-resolve unique ticket type IDs
      const uniqueTypeIds = Array.from(new Set(tickets.map((t) => t.ticket_type_id)));
      const typeMap = new Map<string, TicketTypeDto>();
      for (const id of uniqueTypeIds) {
        try {
          const tt = await firstValueFrom(this.ticketTypeService.getTicketType(id));
          typeMap.set(id, tt);
        } catch {
          // ignore missing ticket type
        }
      }

      // Batch-resolve unique event IDs
      const uniqueEventIds = Array.from(
        new Set(
          Array.from(typeMap.values())
            .map((tt) => tt.event_id)
            .filter((eid) => !!eid)
        )
      );
      const eventMap = new Map<string, string>();
      for (const eid of uniqueEventIds) {
        try {
          const ev = await firstValueFrom(this.eventService.getEvent(eid));
          if (ev) eventMap.set(eid, ev.title);
        } catch {
          // ignore missing event
        }
      }

      // Build view models
      const view: TicketViewModel[] = [];
      for (const t of tickets) {
        const tt = typeMap.get(t.ticket_type_id);
        const eventId = tt?.event_id || '';
        const eventTitle = eventMap.get(eventId) || 'Event';
        view.push({
          ticket: t,
          eventTitle,
          ticketTypeName: tt?.name || '',
          price: tt?.price || 0,
          eventId,
        });
      }

      this.items = view;
    } catch {
      this.items = [];
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}

