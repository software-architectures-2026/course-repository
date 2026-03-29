import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface TicketDto {
  ticket_id: string;
  ticket_type_id: string;
  reservation_id?: string;
  user_id?: string;
  seat?: string;
  status: 'issued' | 'reserved' | 'cancelled';
  issued_at?: string;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly baseUrl: string = (window as any).__env?.API_URL || 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  issueTicket(reservationId: string): Observable<TicketDto> {
    const url = `${this.baseUrl}/api/reservations/${encodeURIComponent(reservationId)}/tickets`;
    return this.http.post<TicketDto>(url, {}).pipe(map((it) => it));
  }

  listTickets(opts?: { event_id?: string; user_id?: string; status?: string; page?: number; limit?: number }): Observable<TicketDto[]> {
    const url = `${this.baseUrl}/api/tickets`;
    let params = new HttpParams();
    if (opts) {
      if (opts.event_id) params = params.set('event_id', opts.event_id);
      if (opts.user_id) params = params.set('user_id', opts.user_id);
      if (opts.status) params = params.set('status', opts.status);
      if (opts.page) params = params.set('page', String(opts.page));
      if (opts.limit) params = params.set('limit', String(opts.limit));
    }
    return this.http.get<TicketDto[]>(url, { params }).pipe(map((items) => items || []));
  }

  getTicket(ticketId: string): Observable<TicketDto> {
    const url = `${this.baseUrl}/api/tickets/${encodeURIComponent(ticketId)}`;
    return this.http.get<TicketDto>(url).pipe(map((it) => it));
  }

  listMyTickets(userId: string): Observable<TicketDto[]> {
    const url = `${this.baseUrl}/api/users/${encodeURIComponent(userId)}/tickets`;
    return this.http.get<TicketDto[]>(url).pipe(map((items) => items || []));
  }
}
