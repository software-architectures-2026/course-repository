import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ReservationDto {
  reservation_id: string;
  event_id: string;
  user_id: string;
  ticket_type_id: string;
  seat?: string;
  status: 'active' | 'expired' | 'cancelled';
  expires_at?: string;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly baseUrl: string = (window as any).__env?.API_URL || 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  createReservation(eventId: string, body: { ticket_type_id: string; seat?: string; metadata?: object }): Observable<ReservationDto> {
    const url = `${this.baseUrl}/api/events/${encodeURIComponent(eventId)}/reservations`;
    return this.http.post<ReservationDto>(url, body).pipe(map((it) => it));
  }

  listByEvent(eventId: string, status?: string): Observable<ReservationDto[]> {
    const url = `${this.baseUrl}/api/events/${encodeURIComponent(eventId)}/reservations`;
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<ReservationDto[]>(url, { params }).pipe(map((items) => items || []));
  }

  getReservation(reservationId: string): Observable<ReservationDto> {
    const url = `${this.baseUrl}/api/reservations/${encodeURIComponent(reservationId)}`;
    return this.http.get<ReservationDto>(url).pipe(map((it) => it));
  }

  cancelReservation(reservationId: string): Observable<ReservationDto> {
    const url = `${this.baseUrl}/api/reservations/${encodeURIComponent(reservationId)}/cancel`;
    return this.http.post<ReservationDto>(url, {}).pipe(map((it) => it));
  }

  deleteReservation(reservationId: string): Observable<void> {
    const url = `${this.baseUrl}/api/reservations/${encodeURIComponent(reservationId)}`;
    return this.http.delete<void>(url).pipe(map((it) => it));
  }
}
