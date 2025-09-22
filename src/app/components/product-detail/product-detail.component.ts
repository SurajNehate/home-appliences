import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { Product, ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent {
  @ViewChild('inner') innerRef?: ElementRef<HTMLDivElement>;
  @ViewChild('imgEl') imgRef?: ElementRef<HTMLImageElement>;

  current?: Product;
  images: string[] = [];
  selectedIndex = 0;
  lightboxOpen = false;

  // Zoom/Pan state
  scale = 1;
  minScale = 1;
  maxScale = 4;
  translateX = 0;
  translateY = 0;
  isPanning = false;
  isPinching = false;
  private lastX = 0;
  private lastY = 0;
  private pointers = new Map<number, { x: number; y: number }>();
  private initialPinchDistance = 0;
  private pinchStartScale = 1;

  constructor(private route: ActivatedRoute, private products: ProductService, private cart: CartService) {}

  ngOnInit() {
    this.route.paramMap.pipe(
      switchMap((params) => this.products.getProduct(Number(params.get('id'))))
    ).subscribe((p) => {
      this.current = p;
      const fallback = p?.imageUrl || (p?.id != null ? `https://picsum.photos/seed/${p.id}/1200/600` : '');
      const imgs = (p?.images && p.images.length > 0) ? p.images : (fallback ? [fallback] : []);
      this.images = imgs;
      this.selectedIndex = 0;
    });
  }

  get transform() {
    return `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
  }

  trackByUrl(_i: number, url: string) { return url; }

  selectImage(i: number) { this.selectedIndex = i; this.resetZoom(); this.recenter(); }
  openLightbox() { this.lightboxOpen = true; this.resetZoom(); setTimeout(() => this.recenter(), 0); }
  closeLightbox() { this.lightboxOpen = false; this.resetZoom(); }

  onImageLoad() { this.resetZoom(); this.recenter(); }

  // Wheel zoom (desktop) with cursor-centered zoom
  onWheel(event: WheelEvent) {
    event.preventDefault();
    const rect = this.innerRef?.nativeElement.getBoundingClientRect();
    if (!rect) return;
    const fx = event.clientX - rect.left;
    const fy = event.clientY - rect.top;
    const delta = -Math.sign(event.deltaY) * 0.12; // sensitivity
    const newScale = this.clamp(this.scale + delta, this.minScale, this.maxScale);
    this.zoomAt(fx, fy, newScale);
  }

  // Pointer events for pan and pinch-zoom
  onPointerDown(event: PointerEvent) {
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointers.size === 1) {
      this.isPanning = true;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
    } else if (this.pointers.size === 2) {
      this.isPinching = true;
      const pts = Array.from(this.pointers.values());
      this.initialPinchDistance = this.distance(pts[0], pts[1]);
      this.pinchStartScale = this.scale;
    }
  }

  onPointerMove(event: PointerEvent) {
    if (!this.pointers.has(event.pointerId)) return;
    const prev = this.pointers.get(event.pointerId)!;
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.isPinching && this.pointers.size === 2) {
      const pts = Array.from(this.pointers.values());
      const dist = this.distance(pts[0], pts[1]);
      const ratio = dist / (this.initialPinchDistance || 1);
      const rect = this.innerRef?.nativeElement.getBoundingClientRect();
      if (!rect) return;
      const midX = (pts[0].x + pts[1].x) / 2 - rect.left;
      const midY = (pts[0].y + pts[1].y) / 2 - rect.top;
      const newScale = this.clamp(this.pinchStartScale * ratio, this.minScale, this.maxScale);
      this.zoomAt(midX, midY, newScale);
      return;
    }

    if (this.isPanning && this.scale > 1) {
      const dx = event.clientX - this.lastX;
      const dy = event.clientY - this.lastY;
      this.translateX += dx;
      this.translateY += dy;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
    }
  }

  onPointerUp(event: PointerEvent) {
    if (this.pointers.has(event.pointerId)) this.pointers.delete(event.pointerId);
    if (this.pointers.size < 2) this.isPinching = false;
    if (this.pointers.size === 0) this.isPanning = false;
  }

  private distance(a: { x: number; y: number }, b: { x: number; y: number }) {
    const dx = a.x - b.x; const dy = a.y - b.y; return Math.hypot(dx, dy);
  }
  private clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

  private recenter() {
    const inner = this.innerRef?.nativeElement;
    const img = this.imgRef?.nativeElement;
    if (!inner || !img) return;
    const cw = inner.clientWidth;
    const ch = inner.clientHeight;
    const iw = img.offsetWidth; // base size without transform
    const ih = img.offsetHeight;
    const dw = iw * this.scale;
    const dh = ih * this.scale;
    // center if smaller; otherwise clamp into container
    const minX = dw <= cw ? (cw - dw) / 2 : (cw - dw);
    const maxX = dw <= cw ? (cw - dw) / 2 : 0;
    const minY = dh <= ch ? (ch - dh) / 2 : (ch - dh);
    const maxY = dh <= ch ? (ch - dh) / 2 : 0;
    this.translateX = this.clamp(this.translateX, minX, maxX);
    this.translateY = this.clamp(this.translateY, minY, maxY);
    if (this.scale === 1) {
      // force perfect center at scale 1
      this.translateX = (cw - iw) / 2;
      this.translateY = (ch - ih) / 2;
    }
  }

  private zoomAt(fx: number, fy: number, newScale: number) {
    const inner = this.innerRef?.nativeElement;
    const img = this.imgRef?.nativeElement;
    if (!inner || !img) { this.scale = newScale; return; }
    const oldScale = this.scale;
    if (newScale === oldScale) return;
    // image point under cursor before zoom
    const ix = (fx - this.translateX) / oldScale;
    const iy = (fy - this.translateY) / oldScale;
    // apply new scale keeping the same point under cursor
    this.scale = newScale;
    this.translateX = fx - this.scale * ix;
    this.translateY = fy - this.scale * iy;
    // clamp within bounds after zoom
    this.recenter();
  }

  private resetZoom() {
    this.scale = 1; this.translateX = 0; this.translateY = 0; this.isPanning = false; this.isPinching = false; this.pointers.clear();
  }

  add(p: Product) {
    this.cart.addItem(p, 1);
  }
}
