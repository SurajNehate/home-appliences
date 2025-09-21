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
  private readonly apiBase = '/.netlify/functions/products-direct';
  private products$ = new BehaviorSubject<CatalogProduct[]>([]);
  private loaded = false;

  constructor(private http: HttpClient) {}

  // Load once and cache from API
  loadProducts(): Observable<CatalogProduct[]> {
    if (!this.loaded) {
      this.http.get<CatalogProduct[]>(this.apiBase).subscribe(list => {
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
    // If already loaded, find locally; else hit API
    if (this.loaded) {
      return this.getAll().pipe(map(list => list.find(p => p.id === id)));
    }
    return this.http.get<CatalogProduct[]>(`${this.apiBase}?id=${id}`).pipe(map(rows => rows && rows[0]));
  }

  add(product: { name: string; price: number; imageUrl: string; category: string; description: string; images?: string[] }): void {
    const images = product.images && product.images.length ? product.images : (product.imageUrl ? [product.imageUrl] : []);
    this.http.post<CatalogProduct[]>(this.apiBase, { ...product, images }).subscribe(created => {
      // API returns array of created rows
      const newList = [...this.products$.value, ...(created || [])];
      this.products$.next(newList);
    });
  }

  update(product: CatalogProduct): void {
    this.http.patch<CatalogProduct[]>(`${this.apiBase}?id=${product.id}`, product).subscribe(updated => {
      // Replace local copy with server response (first row)
      const updatedRow = (updated && updated[0]) || product;
      const list = this.products$.value.map(p => (p.id === updatedRow.id ? updatedRow : p));
      this.products$.next(list);
    });
  }

  remove(id: number): void {
    this.http.delete(`${this.apiBase}?id=${id}`).subscribe(() => {
      this.products$.next(this.products$.value.filter(p => p.id !== id));
    });
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
