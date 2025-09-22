import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Product, ProductService } from '../../services/product.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent {
  products$!: Observable<Product[]>;

  constructor(private products: ProductService, private cart: CartService, private router: Router, public auth: AuthService) {}

  ngOnInit() {
    this.products$ = this.products.getAllProducts();
  }

  trackById(_i: number, p: Product) { return p.id; }

  add(p: Product) {
    this.cart.addItem(p, 1);
  }

  goTo(p: Product) {
    this.router.navigate(['/products', p.id]);
  }
}
