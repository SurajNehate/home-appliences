import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CatalogService, CatalogProduct } from '../../shared/services/catalog.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-catalog-admin',
  templateUrl: './catalog-admin.component.html',
  styleUrls: ['./catalog-admin.component.scss']
})
export class CatalogAdminComponent implements OnInit {
  products: CatalogProduct[] = [];
  editorText = '';
  newProduct: Partial<CatalogProduct> = { name: '', price: 0, category: '', imageUrl: '', description: '', images: [] };
  availableCategories: string[] = [];
  newCustomCategory: string = '';
  addPanelOpen = false;

  // Editing state
  editProductId: number | null = null;
  editProduct: Partial<CatalogProduct> & { images: string[] } = { images: [] } as any;

  constructor(private catalog: CatalogService, private router: Router, private toastr: ToastrService, private http: HttpClient) {}

  // Logout functionality moved to main header

  ngOnInit() {
    this.catalog.getAll().subscribe(list => {
      this.products = list;
      this.editorText = JSON.stringify(list, null, 2);
      this.extractCategories();
    });
  }

  extractCategories() {
    const categories = new Set(this.products.map(p => p.category));
    this.availableCategories = Array.from(categories).sort();
  }

  onSectionChange(val: string) {
    if (val === 'users') { this.router.navigateByUrl('/admin/users'); }
  }

  toggleAddPanel() {
    this.addPanelOpen = !this.addPanelOpen;
  }

  addProduct() {
    let categoryToUse = this.newProduct.category;
    if (this.newProduct.category === '_new_' && this.newCustomCategory.trim()) {
      categoryToUse = this.newCustomCategory.trim();
    }
    
    if (!this.newProduct.name || !categoryToUse || !this.newProduct.price) return;
    
    this.catalog.add({
      name: this.newProduct.name!,
      price: Number(this.newProduct.price),
      imageUrl: (this.newProduct.images && this.newProduct.images[0]) || this.newProduct.imageUrl || '',
      category: categoryToUse!,
      description: this.newProduct.description || '',
      images: (this.newProduct.images as string[]) || []
    });
    
    this.newProduct = { name: '', price: 0, category: '', imageUrl: '', description: '', images: [] };
    this.newCustomCategory = '';
    this.extractCategories(); // Refresh categories list
    
    this.toastr.success('Product added and saved to database.', 'Product Added');
  }

  // Removed manual add-by-URL for new product; uploads only

  async onUploadNewFiles(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files; if (!files || !files.length) return;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const data_base64 = await this.fileToBase64(f);
      this.http.post<any>('/.netlify/functions/image-upload', {
        product_id: null,
        filename: f.name,
        content_type: f.type || 'application/octet-stream',
        data_base64: data_base64.split(',').pop()
      }).subscribe(
        res => {
          const url = res && res.url; if (url) {
            (this.newProduct.images as string[]).push(url);
            if (!this.newProduct.imageUrl) this.newProduct.imageUrl = url;
          }
        },
        _ => this.toastr.error('Upload failed', f.name)
      );
    }
    input.value = '';
  }

  moveNewImage(i: number, dir: number) {
    const imgs = this.newProduct.images as string[];
    const j = i + dir;
    if (j < 0 || j >= imgs.length) return;
    [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
    if (this.newProduct.imageUrl === imgs[j]) this.newProduct.imageUrl = imgs[i];
  }

  removeNewImage(i: number) {
    const imgs = this.newProduct.images as string[];
    imgs.splice(i, 1);
    if (this.newProduct.imageUrl && (!imgs.length || !imgs.includes(this.newProduct.imageUrl))) {
      this.newProduct.imageUrl = imgs[0] || '';
    }
  }

  startEdit(p: CatalogProduct) {
    this.editProductId = p.id;
    this.editProduct = { ...p, images: [...(p.images || (p.imageUrl ? [p.imageUrl] : []))] } as any;
  }

  cancelEdit() {
    this.editProductId = null;
    this.editProduct = { images: [] } as any;
  }


  async onUploadEditFiles(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files; if (!files || !files.length) return;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const data_base64 = await this.fileToBase64(f);
      this.http.post<any>('/.netlify/functions/image-upload', {
        product_id: this.editProductId,
        filename: f.name,
        content_type: f.type || 'application/octet-stream',
        data_base64: data_base64.split(',').pop()
      }).subscribe(
        res => {
          const url = res && res.url; if (url) {
            this.editProduct.images.push(url);
            if (!this.editProduct.imageUrl) this.editProduct.imageUrl = url;
          }
        },
        _ => this.toastr.error('Upload failed', f.name)
      );
    }
    input.value = '';
  }

  moveEditImage(i: number, dir: number) {
    const imgs = this.editProduct.images;
    const j = i + dir;
    if (j < 0 || j >= imgs.length) return;
    [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
    if (this.editProduct.imageUrl === imgs[j]) this.editProduct.imageUrl = imgs[i];
  }

  removeEditImage(i: number) {
    const imgs = this.editProduct.images;
    imgs.splice(i, 1);
    if (this.editProduct.imageUrl && (!imgs.length || !imgs.includes(this.editProduct.imageUrl))) {
      this.editProduct.imageUrl = imgs[0] || '';
    }
  }

  saveEdit() {
    if (!this.editProductId) return;
    const payload = { ...(this.editProduct as any), id: this.editProductId } as CatalogProduct;
    this.catalog.update(payload);
    this.toastr.success('Product updated', 'Saved');
    this.cancelEdit();
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  deleteProduct(id: number) {
    this.catalog.remove(id);
    this.toastr.success('Product deleted from database.', 'Product Deleted');
  }

  downloadJson() {
    // No-op: JSON download not needed when using database
  }

  applyEditor() {
    this.catalog.importFromJson(this.editorText);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length ? input.files[0] : undefined;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const text = String((e.target as FileReader).result);
      this.editorText = text;
      this.applyEditor();
    };
    reader.readAsText(file);
    input.value = '';
  }
}
