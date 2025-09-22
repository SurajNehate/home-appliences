import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Product, ProductService } from '../../services/product.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-admin-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink, MatTableModule, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './admin-catalog.component.html',
  styleUrl: './admin-catalog.component.scss'
})
export class AdminCatalogComponent {
  products$!: Observable<Product[]>;
  displayedColumns = ['id', 'name', 'price', 'category', 'status', 'actions'];

  constructor(private products: ProductService) {}

  ngOnInit() {
    this.products$ = this.products.getAllProducts();
  }

  delete(id: number | undefined) {
    if (!id) return;
    if (!confirm('Delete this product?')) return;
    this.products.deleteProduct(id).subscribe(() => this.ngOnInit());
  }
}
