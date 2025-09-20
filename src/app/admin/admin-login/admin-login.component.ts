import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoginSignupService } from '../../shared/services/login-signup.service';
import { UsersService } from '../../shared/services/users.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss']
})
export class AdminLoginComponent implements OnInit {

  signInFormValue: any = {};
  user_data;

  constructor(private router: Router, private logsign_service: LoginSignupService, private usersService: UsersService, private toastr: ToastrService) { }

  ngOnInit() {
    // Ensure users.json is loaded before attempting admin sign-in
    this.usersService.all().subscribe();
  }

  onSubmitSignIn() {
    const fv = this.signInFormValue || {};
    if (!fv.userEmail || !fv.userPassword) {
      this.toastr.error('Please enter email and password', 'Validation');
      return;
    }
    const user = this.usersService.findByCredentials(fv.userEmail, fv.userPassword);
    if (user && user.role === 'admin') {
      sessionStorage.setItem('user_session_id', String(user.id));
      sessionStorage.setItem('role', 'admin');
      this.router.navigateByUrl('/admin/catalog');
    } else {
      this.toastr.error('Invalid admin credentials', 'Sign in failed');
    }
  }
}
