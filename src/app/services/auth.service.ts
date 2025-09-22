import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/.netlify/functions';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenKey = 'auth_token';

  constructor(private http: HttpClient) {
    const token = localStorage.getItem(this.tokenKey);
    if (token) {
      this.getCurrentUser().subscribe({
        next: () => {},
        error: () => this.logout(),
      });
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/auth-direct?action=login`,
      { email, password }
    ).pipe(
      tap(response => {
        localStorage.setItem(this.tokenKey, response.token);
        this.currentUserSubject.next(response.user);
      })
    );
  }

  signup(name: string, email: string, password: string, role: string = 'member'): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/auth-direct?action=signup`,
      { name, email, password, role }
    ).pipe(
      tap(response => {
        localStorage.setItem(this.tokenKey, response.token);
        this.currentUserSubject.next(response.user);
      })
    );
  }

  signupMember(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.signup(name, email, password, 'member');
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): Observable<{user: User}> {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) {
      throw new Error('No token found');
    }

    return this.http.get<{user: User}>(
      `${this.apiUrl}/auth-direct`,
      {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${token}`
        })
      }
    ).pipe(
      tap(response => {
        this.currentUserSubject.next(response.user);
      })
    );
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'admin';
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
}
