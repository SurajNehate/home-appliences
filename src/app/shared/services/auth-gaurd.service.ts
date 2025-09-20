import { Injectable } from '@angular/core';

import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivate } from '@angular/router';

//Admin before login check
@Injectable({
  providedIn: "root"
})
export class AdminAuthGuardLogin implements CanActivate {
  constructor(private router: Router) { }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    let role = sessionStorage.getItem("role")
    if (role == "admin") {
      this.router.navigate(["/admin-dashboard"]);
      return false;
    } else {
      return true;
    }
  }
}

//Admin after login check
@Injectable({
  providedIn: 'root'
})
export class AdminAuthGaurdService {
  constructor(private router: Router) { }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    let role = sessionStorage.getItem("role")
    if (role == 'admin') {
      return true;
    } else {
      this.router.navigate(["/admin-login"]);
      return false;
    }
  }
}

//Member before login
@Injectable({
  providedIn: "root"
})
export class MemberAuthGuardLogin implements CanActivate {
  constructor(private router: Router) { }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    let role = sessionStorage.getItem("role")
    if (role == "member") {
      this.router.navigate(["/"]);
      return false;
    } else {
      return true;
    }
  }
}

//Member after login
@Injectable({
  providedIn: 'root'
})
export class MemberAuthGaurdService {
  constructor(private router: Router) { }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    let role = sessionStorage.getItem("role");
    if (role == 'member') {
      return true;
    } else {
      this.router.navigate(["/sign-in"]);
      return false;
    }
  }
}
