import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-checkout-guest',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSnackBarModule],
  templateUrl: './checkout-guest.component.html',
  styleUrl: './checkout-guest.component.scss'
})
export class CheckoutGuestComponent {
  form!: FormGroup;

  constructor(private fb: FormBuilder, public cart: CartService, private snack: MatSnackBar) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      phone: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  private encode(data: Record<string, string>): string {
    return Object.keys(data)
      .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(data[k]))
      .join('&');
  }

  async submit() {
    if (this.form.invalid) return;
    const value = this.form.value as any;

    // Preferred: Neon-backed order via Netlify Function
    const order = {
      name: value.name,
      email: value.email,
      address: value.address,
      phone: value.phone,
      items: (this.cart as any).itemsSubject.value,
      total: this.cart.total,
    };

    try {
      const res = await fetch('/.netlify/functions/orders-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || 'ORDER_FAILED');
      const orderId = body?.id;
      this.cart.clear();
      this.form.reset();
      this.snack.open(`Thank you! Your order${orderId ? ' #' + orderId : ''} was placed successfully.`, 'Close', { duration: 5000 });
    } catch (e: any) {
      this.snack.open(e?.message || 'Failed to submit order. Please try again.', 'Close', { duration: 5000 });
    }
  }
}
