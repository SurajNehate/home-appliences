import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CatalogService, CatalogProduct } from '../shared/services/catalog.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  products: CatalogProduct[] = [];
  categories: string[] = [];
  activeCategory: string = 'All';
  searchTerm: string = '';

  constructor(private router: Router, private catalog: CatalogService) { }

  ngOnInit() {
    this.catalog.getAll().subscribe(list => {
      this.products = list;
      this.categories = Array.from(new Set(list.map(p => p.category)));
    });
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

  viewProduct(id: number) {
    this.router.navigate(['/catalog', id]);
  }
}
