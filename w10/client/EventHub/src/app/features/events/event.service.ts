import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface EventDto {
  event_id: string;
  organizer_id: string;
  title: string;
  description?: string;
  category?: string;
  location: string;
  start_time: string;
  end_time: string;
  visibility: boolean;
  published: boolean;
  metadata?: any;
}

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly baseUrl: string = (window as any).__env?.API_URL || 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  listEvents(opts: Record<string, any> = {}): Observable<EventDto[]> {
    const url = `${this.baseUrl}/api/events`;
    let params = new HttpParams();
    Object.keys(opts || {}).forEach((k) => {
      if (opts[k] !== undefined && opts[k] !== null) params = params.set(k, String(opts[k]));
    });
    return this.http.get<EventDto[]>(url, { params }).pipe(
      map((items) => items || [])
    );
  }

  getEvent(id: string): Observable<EventDto | null> {
    const url = `${this.baseUrl}/api/events/${encodeURIComponent(id)}`;
    return this.http.get<EventDto>(url).pipe(
      map((it) => it || null)
    );
  }
}
