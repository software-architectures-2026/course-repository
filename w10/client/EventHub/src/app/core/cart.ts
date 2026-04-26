import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  eventId: string;
  eventTitle: string;
  ticketTypeId: string;
  ticketTypeName: string;
  price: number;
  quantity: number;
  seat?: string | null;
  buyerName?: string | null;
  buyerEmail?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly STORAGE_KEY = 'eventhub_cart';
  private itemsSubject = new BehaviorSubject<CartItem[]>(this.load());

  items$() {
    return this.itemsSubject.asObservable();
  }

  getItems(): CartItem[] {
    return this.itemsSubject.value;
  }

  add(item: CartItem) {
    const current = this.getItems().slice();
    // try to merge same event/ticketType
    const idx = current.findIndex(
      (it) => it.eventId === item.eventId && it.ticketTypeId === item.ticketTypeId
    );
    if (idx >= 0) {
      current[idx].quantity += item.quantity;
    } else {
      current.push(item);
    }
    this.save(current);
  }

  remove(index: number) {
    const current = this.getItems().slice();
    current.splice(index, 1);
    this.save(current);
  }

  clear() {
    this.save([]);
  }

  private load(): CartItem[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private save(items: CartItem[]) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items || []));
    } catch {}
    this.itemsSubject.next(items || []);
  }
}
