import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss'
})
export class AdminLoginComponent {
  form!: FormGroup;
  error = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  login() {
    if (this.form.invalid) return;
    const { email, password } = this.form.value as any;
    this.error = '';
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/admin/catalog']),
      error: (e) => this.error = e?.error?.error || 'LOGIN_FAILED'
    });
  }

  // Convenience: allows initial admin signup
  signupAdmin() {
    const { email, password } = this.form.value as any;
    if (!email || !password) { this.error = 'EMAIL_PASSWORD_REQUIRED'; return; }
    this.error = '';
    this.auth.signup('Admin', email, password, 'admin').subscribe({
      next: () => this.router.navigate(['/admin/catalog']),
      error: (e) => this.error = e?.error?.error || 'SIGNUP_FAILED'
    });
  }
}
