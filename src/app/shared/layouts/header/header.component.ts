import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  logged_in: Boolean = false;
  user_role: String;

  constructor(private router: Router, private cart: CartService) { }


  ngOnInit() {}

  ngDoCheck() {
    this.user_role = sessionStorage.getItem("role");
    const user_session_id = sessionStorage.getItem("user_session_id")
    this.logged_in = !!user_session_id;
  }

  get cartCount(): number {
    return this.cart.count();
  }

  logOut() {
    sessionStorage.removeItem("user_session_id");
    sessionStorage.removeItem("role");
    this.router.navigateByUrl('/');
  }

}
