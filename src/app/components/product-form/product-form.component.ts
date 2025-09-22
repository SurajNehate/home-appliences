import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Product, ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss'
})
export class ProductFormComponent {
  @Input() product: Product | null = null;
  @Output() productSaved = new EventEmitter<Product>();
  @Output() cancelled = new EventEmitter<void>();

  productForm: FormGroup;
  selectedMainImage: File | null = null;
  selectedAdditionalImages: File[] = [];
  mainImagePreview: string | null = null;
  additionalImagePreviews: string[] = [];
  isLoading = false;

  categories = ['Curtains', 'Appliances', 'Furniture', 'Decoratives', 'Lighting'];

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      price: ['', [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      status: [true]
    });
  }

  ngOnInit() {
    // If routed with an id param, load the product
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.productService.getProduct(id).subscribe(p => {
        if (p) {
          this.product = p;
          this.productForm.patchValue(p);
          this.mainImagePreview = p.imageUrl || null;
          this.additionalImagePreviews = p.images || [];
        }
      });
    } else if (this.product) {
      this.productForm.patchValue(this.product);
      if (this.product.imageUrl) {
        this.mainImagePreview = this.product.imageUrl;
      }
      if (this.product.images) {
        this.additionalImagePreviews = this.product.images;
      }
    }
  }

  onMainImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedMainImage = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.mainImagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onAdditionalImagesSelected(event: Event) {
    const files = Array.from((event.target as HTMLInputElement).files || []);
    this.selectedAdditionalImages = files;
    this.additionalImagePreviews = [];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.additionalImagePreviews.push(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  removeAdditionalImage(index: number) {
    this.selectedAdditionalImages.splice(index, 1);
    this.additionalImagePreviews.splice(index, 1);
  }

  async onSubmit() {
    if (this.productForm.valid) {
      this.isLoading = true;
      
      try {
        const formData = this.productForm.value;
        
        // Convert images to base64
        if (this.selectedMainImage) {
          formData.imageData = await this.productService.fileToBase64(this.selectedMainImage);
        }
        
        if (this.selectedAdditionalImages.length > 0) {
          formData.additionalImages = await Promise.all(
            this.selectedAdditionalImages.map(file => this.productService.fileToBase64(file))
          );
        }

        let result: Product | undefined;
        // Create/update product core fields (excluding base64s)
        const core: Product = {
          name: formData.name,
          price: formData.price,
          category: formData.category,
          description: formData.description,
          status: formData.status,
        } as Product;

        if (this.product?.id) {
          // Update existing product
          result = await firstValueFrom(this.productService.updateProduct(this.product.id, core));
        } else {
          // Create new product
          result = await firstValueFrom(this.productService.createProduct(core));
        }

        // Upload images if provided
        if (result?.id && (this.selectedMainImage || this.selectedAdditionalImages.length)) {
          await firstValueFrom(this.productService.uploadImages(
            result.id,
            this.mainImagePreview || '',
            this.additionalImagePreviews || [],
          ));
          // Reload updated result
          result = await firstValueFrom(this.productService.getProduct(result.id));
        }
        
        if (result) {
          this.productSaved.emit(result);
        }
        this.resetForm();
        this.router.navigate(['/products']);
      } catch (error) {
        console.error('Error saving product:', error);
        // Handle error (show message to user)
      } finally {
        this.isLoading = false;
      }
    }
  }

  onCancel() {
    this.cancelled.emit();
    this.resetForm();
    this.router.navigate(['/products']);
  }

  private resetForm() {
    this.productForm.reset();
    this.selectedMainImage = null;
    this.selectedAdditionalImages = [];
    this.mainImagePreview = null;
    this.additionalImagePreviews = [];
  }
}
