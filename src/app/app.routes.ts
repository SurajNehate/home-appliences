import { Routes } from '@angular/router';
import { ProductListComponent } from './components/product-list/product-list.component';
import { ProductFormComponent } from './components/product-form/product-form.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';
import { CartComponent } from './components/cart/cart.component';
import { CheckoutGuestComponent } from './components/checkout-guest/checkout-guest.component';
import { ContactUsComponent } from './components/contact-us/contact-us.component';
import { AdminLoginComponent } from './components/admin-login/admin-login.component';
import { AdminCatalogComponent } from './components/admin-catalog/admin-catalog.component';
import { AdminOrdersComponent } from './components/admin-orders/admin-orders.component';
import { AdminUsersComponent } from './components/admin-users/admin-users.component';
import { SignupComponent } from './components/signup/signup.component';
import { ProfileComponent } from './components/profile/profile.component';
import { adminGuard } from './guards/admin.guard';
import { cartNotEmptyGuard } from './guards/cart-not-empty.guard';
import { AdminComponent } from './components/admin/admin.component';

export const routes: Routes = [
  // Home shows the products list
  { path: '', component: ProductListComponent, pathMatch: 'full' },
  // Keep legacy /products path working by redirecting to home
  { path: 'products', redirectTo: '', pathMatch: 'full' },

  { path: 'products/add', component: ProductFormComponent },
  { path: 'products/edit/:id', component: ProductFormComponent },
  { path: 'products/:id', component: ProductDetailComponent },

  { path: 'cart', component: CartComponent },
  { path: 'checkout-guest', component: CheckoutGuestComponent, canActivate: [cartNotEmptyGuard] },
  { path: 'contact-us', component: ContactUsComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'login', component: AdminLoginComponent },
  { path: 'admin-login', component: AdminLoginComponent }, // Keep for backward compatibility
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'products' },
      { path: 'products', component: AdminCatalogComponent },
      { path: 'orders', component: AdminOrdersComponent },
      { path: 'users', component: AdminUsersComponent },
    ]
  },

  // Fallback: any unknown route goes to home (helps with Netlify refresh)
  { path: '**', redirectTo: '' },
];
