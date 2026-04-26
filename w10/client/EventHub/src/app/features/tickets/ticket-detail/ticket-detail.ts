import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TicketService, TicketDto } from '../ticket.service';
import { TicketTypeService, TicketTypeDto } from '../../events/ticket-type.service';
import { EventService } from '../../events/event.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ticket-detail.html',
  styleUrls: ['./ticket-detail.scss'],
})
export class TicketDetail implements OnInit {
  ticket?: TicketDto | null;
  ticketType?: TicketTypeDto | null;
  eventTitle: string = '';
  loading = false;

  constructor(private route: ActivatedRoute, private ticketService: TicketService, private ticketTypeService: TicketTypeService, private eventService: EventService) {}

  async ngOnInit(): Promise<void> {
    this.loading = true;
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.loading = false; return; }

    try {
      this.ticket = await firstValueFrom(this.ticketService.getTicket(id));
      if (this.ticket) {
        try {
          this.ticketType = await firstValueFrom(this.ticketTypeService.getTicketType(this.ticket.ticket_type_id));
          if (this.ticketType && this.ticketType.event_id) {
            const ev = await firstValueFrom(this.eventService.getEvent(this.ticketType.event_id));
            this.eventTitle = ev?.title || '';
          }
        } catch (_) {}
      }
    } finally {
      this.loading = false;
    }
  }
}

