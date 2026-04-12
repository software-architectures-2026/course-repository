import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface TicketTypeDto {
  ticket_type_id: string;
  event_id: string;
  name: string;
  price: number;
  quantity: number;
  metadata?: any;
}

@Injectable({ providedIn: 'root' })
export class TicketTypeService {
  private readonly baseUrl: string = (window as any).__env?.API_URL || 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  listByEvent(eventId: string): Observable<TicketTypeDto[]> {
    const url = `${this.baseUrl}/api/events/${encodeURIComponent(eventId)}/ticket-types`;
    return this.http.get<TicketTypeDto[]>(url).pipe(map((items) => items || []));
  }

  getTicketType(id: string): Observable<TicketTypeDto> {
    const url = `${this.baseUrl}/api/ticket-types/${encodeURIComponent(id)}`;
    return this.http.get<TicketTypeDto>(url).pipe(map((it) => it));
  }
}
