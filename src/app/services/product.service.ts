import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export interface Product {
  id?: number;
  name: string;
  price: number;
  category: string;
  description: string;
  status?: boolean;
  imageUrl?: string;
  images?: string[];
  imageData?: string;
  additionalImages?: string[];
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = '/.netlify/functions';
  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productsSubject.asObservable();

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products-direct`);
  }

  getProduct(id: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products-direct?id=${id}`);
  }

  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(
      `${this.apiUrl}/products-direct`, 
      product,
      { headers: this.getAuthHeaders() }
    );
  }

  updateProduct(id: number, product: Product): Observable<Product> {
    return this.http.put<Product>(
      `${this.apiUrl}/products-direct?id=${id}`, 
      product,
      { headers: this.getAuthHeaders() }
    );
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/products-direct?id=${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  uploadImages(productId: number, imageData: string, additionalImages: string[] = []): Observable<Product> {
    return this.http.post<Product>(
      `${this.apiUrl}/image-upload`,
      { productId, imageData, additionalImages },
      { headers: this.getAuthHeaders() }
    );
  }

  // Utility method to convert file to base64
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
}
