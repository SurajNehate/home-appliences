import { Component } from '@angular/core';
import { CartService } from '../shared/services/cart.service';

function encode(data: Record<string,string>) {
  return Object.keys(data)
    .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(data[k]))
    .join('&');
}

@Component({
  selector: 'app-checkout-guest',
  templateUrl: './checkout-guest.component.html',
  styleUrls: ['./checkout-guest.component.scss']
})
export class CheckoutGuestComponent {
  form = {
    name: '',
    email: '',
    phone: '',
    address: ''
  };
  submitting = false;
  submitted = false;

  constructor(private cart: CartService) {}

  async submit() {
    this.submitting = true;
    const cartData = JSON.stringify(this.cart.getItems());
    const body = encode({
      'form-name': 'checkout',
      ...this.form,
      cart: cartData
    });
    try {
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        // Simulate success locally (Netlify Forms works in production only)
        await new Promise(r => setTimeout(r, 300));
      } else {
        await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body
        });
      }
      this.submitted = true;
      this.cart.clear();
    } catch (e) {
      alert('Failed to submit. Please try again.');
    } finally {
      this.submitting = false;
    }
  }
}
