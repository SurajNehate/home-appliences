import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from './product.service';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
  qty: number;
}

const STORAGE_KEY = 'cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private itemsSubject = new BehaviorSubject<CartItem[]>(this.read());
  items$ = this.itemsSubject.asObservable();

  private read(): CartItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private write(items: CartItem[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    this.itemsSubject.next(items);
  }

  addItem(p: Product, qty = 1) {
    const items = [...this.itemsSubject.value];
    const found = items.find(i => i.id === p.id);
    if (found) {
      found.qty += qty;
    } else if (p.id) {
      items.push({ id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl, qty });
    }
    this.write(items);
  }

  removeItem(id: number) {
    const next = this.itemsSubject.value.filter(i => i.id !== id);
    this.write(next);
  }

  updateQty(id: number, qty: number) {
    const items = [...this.itemsSubject.value];
    const found = items.find(i => i.id === id);
    if (found) {
      found.qty = Math.max(1, qty);
      this.write(items);
    }
  }

  clear() { this.write([]); }

  get total(): number {
    return this.itemsSubject.value.reduce((s, i) => s + i.price * i.qty, 0);
  }
}
