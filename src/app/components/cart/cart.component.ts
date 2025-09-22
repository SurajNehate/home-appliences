import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { CartItem, CartService } from '../../services/cart.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, MatTableModule, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent {
  items$!: Observable<CartItem[]>;

  displayedColumns = ['image', 'name', 'price', 'qty', 'total', 'actions'];

  constructor(public cart: CartService) {}

  ngOnInit() {
    this.items$ = this.cart.items$;
  }

  inc(id: number) {
    const item = this.find(id);
    if (item) this.cart.updateQty(id, item.qty + 1);
  }

  dec(id: number) {
    const item = this.find(id);
    if (item) this.cart.updateQty(id, Math.max(1, item.qty - 1));
  }

  remove(id: number) { this.cart.removeItem(id); }

  clear() { this.cart.clear(); }

  private find(id: number) { return (this.cart as any).itemsSubject.value.find((i: CartItem) => i.id === id) as CartItem | undefined; }
}
