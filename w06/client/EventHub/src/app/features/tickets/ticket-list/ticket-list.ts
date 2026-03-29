import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TicketService, TicketDto } from '../ticket.service';
import { TicketTypeService, TicketTypeDto } from '../../events/ticket-type.service';
import { EventService } from '../../events/event.service';
import { Auth } from '../../../core/auth';
import { firstValueFrom } from 'rxjs';

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

  constructor(private ticketService: TicketService, private ticketTypeService: TicketTypeService, private eventService: EventService, private auth: Auth) {}

  async ngOnInit(): Promise<void> {
    this.loading = true;
    const user = this.auth.getUser();
    if (!user) {
      this.items = [];
      this.loading = false;
      return;
    }

    try {
      const tickets = await firstValueFrom(this.ticketService.listMyTickets(user.user_id));
      const uniqueTypeIds = Array.from(new Set(tickets.map((t) => t.ticket_type_id)));
      const typeMap = new Map<string, TicketTypeDto>();
      for (const id of uniqueTypeIds) {
        try {
          const tt = await firstValueFrom(this.ticketTypeService.getTicketType(id));
          typeMap.set(id, tt);
        } catch (_) {
          // ignore missing ticket type
        }
      }

      const view: TicketViewModel[] = [];
      for (const t of tickets) {
        const tt = typeMap.get(t.ticket_type_id);
        let eventTitle = 'Event';
        let eventId = '';
        if (tt && tt.event_id) {
          eventId = tt.event_id;
          try {
            const ev = await firstValueFrom(this.eventService.getEvent(tt.event_id));
            eventTitle = ev?.title || eventTitle;
          } catch (_) {}
        }
        view.push({ ticket: t, eventTitle, ticketTypeName: tt?.name || '', price: tt?.price || 0, eventId });
      }

      this.items = view;
    } finally {
      this.loading = false;
    }
  }
}

