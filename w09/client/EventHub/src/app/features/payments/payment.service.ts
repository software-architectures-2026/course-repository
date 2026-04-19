import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PaymentDto {
  payment_id: string;
  reservation_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  method?: string;
  gateway_response?: any;
  processed_at?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly baseUrl: string = (window as any).__env?.API_URL || 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  initiatePayment(reservationId: string, body: { amount: number; method?: string; gateway_data?: object }): Observable<PaymentDto> {
    const url = `${this.baseUrl}/api/reservations/${encodeURIComponent(reservationId)}/payments`;
    return this.http.post<PaymentDto>(url, body).pipe(map((it) => it));
  }

  getPayment(paymentId: string): Observable<PaymentDto> {
    const url = `${this.baseUrl}/api/payments/${encodeURIComponent(paymentId)}`;
    return this.http.get<PaymentDto>(url).pipe(map((it) => it));
  }

  capturePayment(paymentId: string): Observable<PaymentDto> {
    const url = `${this.baseUrl}/api/payments/${encodeURIComponent(paymentId)}`;
    return this.http.post<PaymentDto>(url, { action: 'capture' }).pipe(map((it) => it));
  }
}
