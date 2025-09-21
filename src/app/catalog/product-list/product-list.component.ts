import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CatalogService, CatalogProduct } from '../../shared/services/catalog.service';
import { CartService } from '../../shared/services/cart.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  products: CatalogProduct[] = [];
  categories: string[] = [];
  activeCategory: string = 'All';
  searchTerm: string = '';

  constructor(private catalog: CatalogService, private cart: CartService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.catalog.getAll().subscribe(list => {
      this.products = list;
      this.categories = Array.from(new Set(list.map(p => p.category)));
      // Apply category from query param if present
      const qp = this.route.snapshot.queryParamMap.get('category');
      if (qp && this.categories.indexOf(qp) >= 0) {
        this.activeCategory = qp;
      }
    });
  }

  setCategory(cat: string) {
    this.activeCategory = cat;
  }

  filtered(): CatalogProduct[] {
    const term = (this.searchTerm || '').toLowerCase();
    let list = this.products;
    if (this.activeCategory !== 'All') {
      list = list.filter(p => p.category === this.activeCategory);
    }
    if (term) {
      list = list.filter(p => (p.name || '').toLowerCase().includes(term) || (p.description || '').toLowerCase().includes(term));
    }
    return list;
  }

  addToCart(p: CatalogProduct) {
    this.cart.add({ id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl }, 1);
    alert('Added to cart');
  }
}
