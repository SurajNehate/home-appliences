import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface CatalogProduct {
  id: number;
  name: string;
  price: number;
  imageUrl: string; // main image for quick access / backwards-compat
  images?: string[]; // optional gallery images
  category: string; // e.g., Curtains, Appliances
  description: string;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly productsUrl = 'assets/products.json';
  private products$ = new BehaviorSubject<CatalogProduct[]>([]);
  private loaded = false;

  constructor(private http: HttpClient) {}

  // Load once and cache
  loadProducts(): Observable<CatalogProduct[]> {
    if (!this.loaded) {
      this.http.get<CatalogProduct[]>(this.productsUrl).subscribe(list => {
        this.products$.next(list || []);
        this.loaded = true;
      });
    }
    return this.products$.asObservable();
  }

  getAll(): Observable<CatalogProduct[]> {
    return this.loadProducts();
  }

  getById(id: number): Observable<CatalogProduct | undefined> {
    return this.getAll().pipe(map(list => list.find(p => p.id === id)));
  }

  add(product: { name: string; price: number; imageUrl: string; category: string; description: string; images?: string[] }): void {
    const list = [...this.products$.value];
    const newId = list.length ? Math.max(...list.map(p => p.id)) + 1 : 1;
    const images = product.images && product.images.length ? product.images : (product.imageUrl ? [product.imageUrl] : []);
    list.push({ id: newId, name: product.name, price: product.price, imageUrl: product.imageUrl, images, category: product.category, description: product.description });
    this.products$.next(list);
  }

  update(product: CatalogProduct): void {
    const list = [...this.products$.value];
    const idx = list.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      list[idx] = { ...product };
      this.products$.next(list);
    }
  }

  remove(id: number): void {
    const list = this.products$.value.filter(p => p.id !== id);
    this.products$.next(list);
  }

  // Export current list as a downloadable products.json
  downloadJson(filename = 'products.json'): void {
    const data = JSON.stringify(this.products$.value, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Replace current list from imported JSON text
  importFromJson(jsonText: string): void {
    try {
      const parsed = JSON.parse(jsonText) as CatalogProduct[];
      if (Array.isArray(parsed)) {
        this.products$.next(parsed);
      }
    } catch (e) {
      console.error('Invalid products JSON', e);
    }
  }
}
