import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { PageNotFoundErrorComponent } from './shared/layouts/page-not-found-error/page-not-found-error.component';
import { AdminAuthGuardLogin, AdminAuthGaurdService } from './shared/services/auth-gaurd.service';
import { AdminLoginComponent } from './admin/admin-login/admin-login.component';
import { SigninSignupComponent } from './customer/signin-signup/signin-signup.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { ProductListComponent } from './catalog/product-list/product-list.component';
import { ProductDetailComponent } from './catalog/product-detail/product-detail.component';
import { CartComponent } from './cart/cart.component';
import { CheckoutGuestComponent } from './checkout-guest/checkout-guest.component';
import { CatalogAdminComponent } from './admin/catalog-admin/catalog-admin.component';
import { UsersAdminComponent } from './admin/users-admin/users-admin.component';

const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  // Public catalog and cart routes (no login required)
  { path: 'catalog', component: ProductListComponent },
  { path: 'catalog/:id', component: ProductDetailComponent },
  { path: 'cart', component: CartComponent },
  { path: 'checkout-guest', component: CheckoutGuestComponent },
  // Optional standard auth/profile pages
  { path: 'sign-in', component: SigninSignupComponent },
  { path: 'sign-up', component: SigninSignupComponent },
  { path: 'my-profile', component: UserProfileComponent },
  { path: 'contact-us', component: ContactUsComponent },
  // Admin
  { path: 'admin-login', canActivate: [AdminAuthGuardLogin], component: AdminLoginComponent },
  { path: 'admin/catalog', canActivate: [AdminAuthGaurdService], component: CatalogAdminComponent },
  { path: 'admin/users', canActivate: [AdminAuthGaurdService], component: UsersAdminComponent },
  // Fallback
  { path: '**', component: PageNotFoundErrorComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
