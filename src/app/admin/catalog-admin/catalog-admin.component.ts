import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
  newProduct: Partial<CatalogProduct> = { name: '', price: 0, category: '', imageUrl: '', description: '' };
  availableCategories: string[] = [];
  newCustomCategory: string = '';

  constructor(private catalog: CatalogService, private router: Router, private toastr: ToastrService) {}

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

  addProduct() {
    let categoryToUse = this.newProduct.category;
    if (this.newProduct.category === '_new_' && this.newCustomCategory.trim()) {
      categoryToUse = this.newCustomCategory.trim();
    }
    
    if (!this.newProduct.name || !categoryToUse || !this.newProduct.price) return;
    
    this.catalog.add({
      name: this.newProduct.name!,
      price: Number(this.newProduct.price),
      imageUrl: this.newProduct.imageUrl || '',
      category: categoryToUse!,
      description: this.newProduct.description || ''
    });
    
    this.newProduct = { name: '', price: 0, category: '', imageUrl: '', description: '' };
    this.newCustomCategory = '';
    this.extractCategories(); // Refresh categories list
    
    // Auto-download updated JSON for deployment
    this.downloadJson();
    this.toastr.success('Product added! Downloaded updated products.json — replace src/assets/products.json and deploy to make it live.', 'Product Added');
  }

  deleteProduct(id: number) {
    this.catalog.remove(id);
    // Auto-download updated JSON for deployment
    this.downloadJson();
    this.toastr.success('Product deleted! Downloaded updated products.json — replace src/assets/products.json and deploy to make it live.', 'Product Deleted');
  }

  downloadJson() {
    this.catalog.downloadJson('products.json');
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
