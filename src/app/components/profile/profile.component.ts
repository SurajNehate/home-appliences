import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  form!: FormGroup;
  error = '';

  constructor(private fb: FormBuilder, private http: HttpClient, public auth: AuthService) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['']
    });
  }

  ngOnInit() {
    this.auth.getCurrentUser().subscribe({
      next: (res) => {
        this.form.patchValue(res.user);
      },
      error: () => this.error = 'LOAD_FAILED'
    });
  }

  save() {
    if (this.form.invalid) return;
    const token = this.auth.getToken();
    if (!token) { this.error = 'NOT_LOGGED_IN'; return; }
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    const payload = this.form.value as any; // name, email, phone
    this.http.patch('/.netlify/functions/users-direct', payload, { headers }).subscribe({
      next: () => alert('Profile updated'),
      error: (e) => this.error = e?.error?.error || 'SAVE_FAILED'
    });
  }
}
