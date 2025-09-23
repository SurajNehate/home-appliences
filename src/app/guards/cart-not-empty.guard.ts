import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../services/cart.service';

// Blocks access to checkout when the cart is empty; redirects to /cart
export const cartNotEmptyGuard: CanActivateFn = () => {
  const cart = inject(CartService) as any;
  const router = inject(Router);
  try {
    const items = cart?.itemsSubject?.value || [];
    if (Array.isArray(items) && items.length > 0) return true;
  } catch {}
  router.navigate(['/cart']);
  return false;
};
