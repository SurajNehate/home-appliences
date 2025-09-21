import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CatalogService, CatalogProduct } from '../../shared/services/catalog.service';
import { CartService } from '../../shared/services/cart.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  product?: CatalogProduct;
  images: string[] = [];
  selected = 0;
  private touchStartX: number = 0;
  private touchEndX: number = 0;

  constructor(
    private route: ActivatedRoute,
    private catalog: CatalogService,
    private cart: CartService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.catalog.getById(id).subscribe(p => {
      this.product = p;
      if (p) {
        this.images = (p.images && p.images.length ? p.images : [p.imageUrl]).filter(Boolean);
        this.selected = 0;
      }
    });
  }

  select(i: number) { this.selected = i; }

  prev() {
    if (!this.images.length) return;
    this.selected = (this.selected - 1 + this.images.length) % this.images.length;
  }

  next() {
    if (!this.images.length) return;
    this.selected = (this.selected + 1) % this.images.length;
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(ev: KeyboardEvent) {
    if (ev.key === 'ArrowLeft') { this.prev(); }
    else if (ev.key === 'ArrowRight') { this.next(); }
  }

  onTouchStart(ev: TouchEvent) {
    this.touchStartX = ev.changedTouches && ev.changedTouches.length ? ev.changedTouches[0].clientX : 0;
  }

  onTouchEnd(ev: TouchEvent) {
    this.touchEndX = ev.changedTouches && ev.changedTouches.length ? ev.changedTouches[0].clientX : 0;
    const delta = this.touchEndX - this.touchStartX;
    const threshold = 50; // px
    if (Math.abs(delta) > threshold) {
      if (delta < 0) this.next(); else this.prev();
    }
  }

  addToCart() {
    if (!this.product) return;
    const p = this.product;
    this.cart.add({ id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl }, 1);
    alert('Added to cart');
  }
}
