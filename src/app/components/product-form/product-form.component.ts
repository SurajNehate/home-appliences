import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Product, ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-form',
  imports: [CommonModule, ReactiveFormsModule],
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
    private productService: ProductService
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
    if (this.product) {
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
        if (this.product?.id) {
          // Update existing product
          result = await this.productService.updateProduct(this.product.id, formData).toPromise();
        } else {
          // Create new product
          result = await this.productService.createProduct(formData).toPromise();
        }
        
        if (result) {
          this.productSaved.emit(result);
        }
        this.resetForm();
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
  }

  private resetForm() {
    this.productForm.reset();
    this.selectedMainImage = null;
    this.selectedAdditionalImages = [];
    this.mainImagePreview = null;
    this.additionalImagePreviews = [];
  }
}
