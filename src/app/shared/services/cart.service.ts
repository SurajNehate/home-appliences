import { Injectable } from '@angular/core';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  qty: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly key = 'guest_cart_v1';

  private read(): CartItem[] {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  }

  private write(items: CartItem[]): void {
    localStorage.setItem(this.key, JSON.stringify(items));
  }

  getItems(): CartItem[] {
    return this.read();
  }

  add(item: { id: number; name: string; price: number; imageUrl: string }, qty = 1): void {
    const items = this.read();
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) {
      items[idx].qty += qty;
    } else {
      items.push({ id: item.id, name: item.name, price: item.price, imageUrl: item.imageUrl, qty });
    }
    this.write(items);
  }

  updateQty(id: number, qty: number): void {
    const items = this.read();
    const idx = items.findIndex(i => i.id === id);
    if (idx >= 0) {
      items[idx].qty = Math.max(1, qty);
      this.write(items);
    }
  }

  remove(id: number): void {
    const items = this.read().filter(i => i.id !== id);
    this.write(items);
  }

  clear(): void {
    this.write([]);
  }

  total(): number {
    return this.read().reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  count(): number {
    return this.read().reduce((sum, i) => sum + i.qty, 0);
  }
}
