import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuardService {
  constructor(private auth: AuthService, private router: Router) {}
  canActivate: CanActivateFn = () => {
    if (this.auth.isAdmin()) return true;
    this.router.navigate(['/admin-login']);
    return false;
  };
}
