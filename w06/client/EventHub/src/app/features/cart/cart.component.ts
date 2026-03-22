import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/cart';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent {
  items: any[] = [];

  constructor(private cart: CartService) {
    // initialize after cart is injected
    this.items = this.cart.getItems();
    this.cart.items$().subscribe((list) => (this.items = list));
  }

  remove(i: number) {
    this.cart.remove(i);
  }

  total() {
    return this.items.reduce((s, it) => s + (it.price || 0) * it.quantity, 0);
  }

  checkout() {
    // Not implemented: navigate to payments or create reservation
    alert('Checkout not implemented in this demo.');
  }
}
