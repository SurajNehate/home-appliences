import { Component } from '@angular/core';
import { CartService, CartItem } from '../shared/services/cart.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent {
  constructor(public cart: CartService) {}

  items(): CartItem[] {
    return this.cart.getItems();
  }

  updateQty(id: number, qty: string) {
    const n = Number(qty);
    if (!isNaN(n) && n > 0) this.cart.updateQty(id, n);
  }

  remove(id: number) {
    this.cart.remove(id);
  }

  clear() {
    this.cart.clear();
  }
}
