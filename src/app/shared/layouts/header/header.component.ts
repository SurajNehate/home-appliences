import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  logged_in: Boolean = false;
  user_role: String;

  displayName: string = '';

  constructor(private router: Router, private http: HttpClient, private cart: CartService) { }


  ngOnInit() {}

  ngDoCheck() {
    const prevRole = this.user_role;
    this.user_role = sessionStorage.getItem("role");
    const user_session_id = sessionStorage.getItem("user_session_id")
    const wasLogged = this.logged_in;
    this.logged_in = !!user_session_id;
    if (this.logged_in && (!wasLogged || this.user_role !== prevRole)) {
      this.loadProfile();
    }
    if (!this.logged_in) {
      this.displayName = '';
    }
  }

  private loadProfile() {
    this.http.get<any>('/.netlify/functions/profile').subscribe(
      res => { this.displayName = res && res.user ? res.user.name : ''; },
      _ => { this.displayName = ''; }
    );
  }

  get cartCount(): number {
    return this.cart.count();
  }

  logOut() {
    sessionStorage.removeItem("user_session_id");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("jwt");
    this.router.navigateByUrl('/');
  }

}
