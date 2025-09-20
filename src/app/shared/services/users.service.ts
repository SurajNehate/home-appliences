import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AdminUserRow {
  id: number;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'admin' | 'member';
  age?: number;
  dob?: string;
  language?: any;
  gender?: string;
  aboutYou?: string;
  uploadPhoto?: string;
  agreetc?: boolean;
  address?: {
    id?: number;
    addLine1?: string;
    addLine2?: string;
    city?: string;
    state?: string;
    zipCode?: string | number;
  };
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly apiBase = '/.netlify/functions/users';
  private users$ = new BehaviorSubject<AdminUserRow[]>([]);
  private loaded = false;

  constructor(private http: HttpClient) {}

  signup(row: { name: string; email: string; password: string; phone?: string; role?: 'admin' | 'member' }) {
    return this.http.post<any>('/.netlify/functions/auth-signup', row);
  }

  login(email: string, password: string) {
    return this.http.post<any>('/.netlify/functions/auth-login', { email, password });
  }

  load(): Observable<AdminUserRow[]> {
    if (!this.loaded) {
      this.http.get<AdminUserRow[]>(this.apiBase).subscribe(list => {
        this.users$.next(list || []);
        this.loaded = true;
      });
    }
    return this.users$.asObservable();
  }

  all(): Observable<AdminUserRow[]> { return this.load(); }

  add(row: { name: string; email: string; password: string; phone?: string; role: 'admin' | 'member' }): void {
    this.http.post<AdminUserRow[]>(this.apiBase, row).subscribe(created => {
      this.users$.next([...this.users$.value, ...(created || [])]);
    });
  }

  findByCredentials(email: string, password: string): AdminUserRow | undefined {
    // This is a simple client-side check; in production, implement secure auth
    const e = (email || '').toLowerCase();
    return this.users$.value.find(u => (u.email || '').toLowerCase() === e && u.password === password);
  }

  update(id: number, updates: Partial<AdminUserRow>): void {
    this.http.patch<AdminUserRow[]>(`${this.apiBase}?id=${id}`, updates).subscribe(updated => {
      const row = (updated && updated[0]) || undefined;
      if (row) {
        this.users$.next(this.users$.value.map(u => (u.id === id ? row : u)));
      }
    });
  }

  remove(id: number): void {
    this.http.delete(`${this.apiBase}?id=${id}`).subscribe(() => {
      this.users$.next(this.users$.value.filter(u => u.id !== id));
    });
  }

  downloadJson(filename = 'users.json'): void {
    const data = JSON.stringify(this.users$.value, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  importFromJson(jsonText: string): void {
    try {
      const parsed = JSON.parse(jsonText) as AdminUserRow[];
      if (Array.isArray(parsed)) this.users$.next(parsed);
    } catch (e) { console.error('Invalid users JSON', e); }
  }
}
