import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Observable, combineLatest, map, startWith } from 'rxjs';
import { Product, ProductService } from '../../services/product.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent {
  products$!: Observable<Product[]>;
  categories$!: Observable<string[]>;

  fcCategory = new FormControl<string>('all', { nonNullable: true });
  fcSearch = new FormControl<string>('', { nonNullable: true });

  filtered$!: Observable<Product[]>;

  constructor(private products: ProductService, private cart: CartService, private router: Router, public auth: AuthService) {}

  ngOnInit() {
    this.products$ = this.products.getAllProducts();
    this.categories$ = this.products$.pipe(
      map(list => Array.from(new Set(list.map(p => p.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)))
    );

    this.filtered$ = combineLatest([
      this.products$,
      this.fcCategory.valueChanges.pipe(startWith(this.fcCategory.value)),
      this.fcSearch.valueChanges.pipe(startWith(this.fcSearch.value))
    ]).pipe(
      map(([list, cat, q]) => {
        const ql = (q || '').trim().toLowerCase();
        return list.filter(p => {
          const okCat = cat === 'all' || (p.category || '').toLowerCase() === String(cat).toLowerCase();
          const text = `${p.name || ''} ${p.description || ''} ${p.category || ''}`.toLowerCase();
          const okQ = !ql || text.includes(ql);
          return okCat && okQ;
        });
      })
    );
  }

  trackById(_i: number, p: Product) { return p.id; }

  add(p: Product) {
    this.cart.addItem(p, 1);
  }

  goTo(p: Product) {
    this.router.navigate(['/products', p.id]);
  }
}
