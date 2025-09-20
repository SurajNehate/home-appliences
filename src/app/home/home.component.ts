import { Component, OnInit, HostListener } from '@angular/core';
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
  featured: CatalogProduct[] = [];
  activeCategory: string = 'All';
  searchTerm: string = '';
  isHandset = false;
  sidenavOpened = false;

  constructor(private router: Router, private catalog: CatalogService) { }

  ngOnInit() {
    this.catalog.getAll().subscribe(list => {
      this.products = list;
      this.categories = Array.from(new Set(list.map(p => p.category)));
      this.featured = list.slice(0, 4);
    });
    this.updateViewportFlags();
  }

  @HostListener('window:resize')
  onResize() { this.updateViewportFlags(); }

  private updateViewportFlags() {
    this.isHandset = window.innerWidth < 768;
    if (!this.isHandset) {
      this.sidenavOpened = true;
    }
  }

  goToCategory(cat: string) {
    this.activeCategory = cat;
    // Smooth scroll to products section
    const el = document.getElementById('home-products');
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    if (this.isHandset) { this.sidenavOpened = false; }
  }

  toggleSidenav() { this.sidenavOpened = !this.sidenavOpened; }

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
