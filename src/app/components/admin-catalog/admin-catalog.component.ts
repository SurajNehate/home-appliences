import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, combineLatest, map, startWith } from 'rxjs';
import { Product, ProductService } from '../../services/product.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

@Component({
  selector: 'app-admin-catalog',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  templateUrl: './admin-catalog.component.html',
  styleUrl: './admin-catalog.component.scss'
})
export class AdminCatalogComponent {
  products$!: Observable<Product[]>;
  filtered$!: Observable<Product[]>;
  displayedColumns = ['product', 'category', 'price', 'status', 'created', 'actions'];

  fcSearch = new FormControl<string>('',{ nonNullable: true });
  fcCategory = new FormControl<string>('all', { nonNullable: true });
  categories$!: Observable<string[]>;

  constructor(private products: ProductService) {}

  ngOnInit() {
    this.products$ = this.products.getAllProducts();
    this.categories$ = this.products$.pipe(
      map(list => Array.from(new Set(list.map(p => p.category).filter(Boolean))).sort((a,b)=>a.localeCompare(b)))
    );
    this.filtered$ = combineLatest([
      this.products$,
      this.fcSearch.valueChanges.pipe(startWith(this.fcSearch.value)),
      this.fcCategory.valueChanges.pipe(startWith(this.fcCategory.value))
    ]).pipe(
      map(([list, q, cat]) => {
        const ql = (q || '').trim().toLowerCase();
        return list.filter(p => {
          const byCat = (cat === 'all') || (String(p.category||'').toLowerCase() === String(cat).toLowerCase());
          const text = `${p.name||''} ${p.category||''} ${p.description||''}`.toLowerCase();
          const byQ = !ql || text.includes(ql);
          return byCat && byQ;
        });
      })
    );
  }

  delete(id: number | undefined) {
    if (!id) return;
    if (!confirm('Delete this product?')) return;
    this.products.deleteProduct(id).subscribe(() => this.ngOnInit());
  }
}
