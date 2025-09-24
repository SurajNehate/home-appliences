import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
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
      next: (response) => {
        // Redirect based on user role (case-insensitive, safe)
        const role = (response?.user?.role || '').toLowerCase();
        if (role === 'admin') {
          this.router.navigate(['/admin'], { replaceUrl: true });
        } else {
          // Regular members go to home page
          this.router.navigate(['/'], { replaceUrl: true });
        }
      },
      error: (e) => {
        this.error = e?.error?.error || 'LOGIN_FAILED';
      }
    });
  }
}
