import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { CartService } from '../shared/services/cart.service';

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

  constructor(private cart: CartService, private http: HttpClient, private toastr: ToastrService) {}

  async submit() {
    this.submitting = true;
    try {
      const items = this.cart.getItems().map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, imageUrl: i.imageUrl }));
      const customer = { name: this.form.name, email: this.form.email, phone: this.form.phone, address: this.form.address };
      await this.http.post('/.netlify/functions/orders-direct', { customer, items }).toPromise();
      this.submitted = true;
      this.toastr.success('Order placed successfully!', 'Thank you');
      this.cart.clear();
    } catch (e) {
      this.toastr.error('Failed to place order. Please try again.', 'Checkout Error');
    } finally {
      this.submitting = false;
    }
  }
}
