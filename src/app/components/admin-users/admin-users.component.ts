import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Observable, map, startWith } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss']
})
export class AdminUsersComponent {
  users$!: Observable<any[]>;
  displayedColumns = ['id', 'name', 'email', 'phone', 'role', 'created_at', 'actions'];

  form!: FormGroup;
  error = '';

  constructor(private http: HttpClient, private auth: AuthService, private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: [''],
      role: ['member', Validators.required]
    });
  }

  ngOnInit() { this.refresh(); }

  refresh() {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    this.users$ = this.http.get<any[]>('/.netlify/functions/users-direct', { headers }).pipe(
      map(users => users ?? []),
      startWith([])
    );
  }

  addUser() {
    if (this.form.invalid) return;
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    const value = this.form.value as any;
    const payload = { ...value };
    this.http.post<any[]>('/.netlify/functions/users-direct', payload, { headers }).subscribe({
      next: () => { this.form.reset({ role: 'member' }); this.refresh(); },
      error: (e) => this.error = e?.error?.error || 'CREATE_FAILED'
    });
  }

  promote(u: any) {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    this.http.patch<any[]>('/.netlify/functions/users-direct?id=' + u.id, { role: 'admin' }, { headers }).subscribe({
      next: () => this.refresh(),
      error: (e) => this.error = e?.error?.error || 'PROMOTE_FAILED'
    });
  }
}
