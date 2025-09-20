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
  private readonly usersUrl = 'assets/users.json';
  private users$ = new BehaviorSubject<AdminUserRow[]>([]);
  private loaded = false;

  constructor(private http: HttpClient) {}

  load(): Observable<AdminUserRow[]> {
    if (!this.loaded) {
      this.http.get<AdminUserRow[]>(this.usersUrl).subscribe(list => {
        this.users$.next(list || []);
        this.loaded = true;
      });
    }
    return this.users$.asObservable();
  }

  all(): Observable<AdminUserRow[]> { return this.load(); }

  add(row: { name: string; email: string; password: string; phone?: string; role: 'admin' | 'member' }): void {
    const list = [...this.users$.value];
    const newId = list.length ? Math.max(...list.map(u => u.id)) + 1 : 1;
    list.push({ id: newId, name: row.name, email: row.email, password: row.password, phone: row.phone || '', role: row.role });
    this.users$.next(list);
  }

  findByCredentials(email: string, password: string): AdminUserRow | undefined {
    const e = (email || '').toLowerCase();
    return this.users$.value.find(u => (u.email || '').toLowerCase() === e && u.password === password);
  }

  update(id: number, updates: Partial<AdminUserRow>): void {
    const list = [...this.users$.value];
    const index = list.findIndex(u => u.id === id);
    if (index >= 0) {
      list[index] = { ...list[index], ...updates };
      this.users$.next(list);
    }
  }

  remove(id: number): void {
    this.users$.next(this.users$.value.filter(u => u.id !== id));
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
