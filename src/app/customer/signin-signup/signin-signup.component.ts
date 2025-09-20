import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { LoginSignupService } from '../../shared/services/login-signup.service';
import { User } from '../../core/models/object-model';
import { UsersService } from '../../shared/services/users.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-signin-signup',
  templateUrl: './signin-signup.component.html',
  styleUrls: ['./signin-signup.component.scss']
})
export class SigninSignupComponent implements OnInit {

  regForm: Boolean = false;
  signUpform: FormGroup;
  signInform: FormGroup;
  signUpsubmitted = false;
  href: String = '';
  user_data;
  user_dto: User;
  user_reg_data;

  signInFormValue: any = {};

  constructor(private formBuilder: FormBuilder, private router: Router, private logsign_service: LoginSignupService, private usersService: UsersService, private toastr: ToastrService) { }

  ngOnInit() {
    this.href = this.router.url;
    if (this.href == '/sign-up') {
      this.regForm = true;
    } else if (this.href == '/sign-in') {
      this.regForm = false;
    }

    // Ensure users.json is loaded before attempting sign-in
    this.usersService.all().subscribe();

    this.signUpform = this.formBuilder.group({
      name: ['', Validators.required],
      mobNumber: ['', Validators.required],
      age: ['', Validators.required],
      dob: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      addLine1: ['', Validators.required],
      addLine2: [],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', Validators.required],
      language: ['', Validators.required],
      gender: ['', Validators.required],
      aboutYou: ['', Validators.required],
      uploadPhoto: ['', Validators.required],
      agreetc: ['', Validators.required],

    })

    this.signInform = this.formBuilder.group({

    })
  }

  get rf() { return this.signUpform.controls; }

  onSubmitSignUp() {
    this.signUpsubmitted = true;
    if (this.signUpform.invalid) {
      this.toastr.error('Please correct the errors in the form', 'Validation');
      return;
    }
    const v = this.signUpform.value;
    // Build user row for users.json with all captured fields
    const newUser = {
      name: v.name,
      email: v.email,
      password: v.password,
      phone: v.mobNumber,
      role: 'member',
      age: v.age,
      dob: v.dob,
      language: v.language,
      gender: v.gender,
      aboutYou: v.aboutYou,
      uploadPhoto: v.uploadPhoto,
      agreetc: !!v.agreetc,
      address: {
        id: 0,
        addLine1: v.addLine1,
        addLine2: v.addLine2,
        city: v.city,
        state: v.state,
        zipCode: v.zipCode,
      }
    } as any;
    this.usersService.add(newUser);
    // Download updated users.json so it can be persisted in repo
    this.usersService.downloadJson('users.json');
    this.toastr.success('Account created. Downloaded users.json — replace src/assets/users.json to persist.', 'Success');
    this.router.navigateByUrl('/sign-in');
  }

  onSubmitSignIn() {
    const fv = this.signInFormValue || {};
    if (!fv.userEmail || !fv.userPassword) {
      this.toastr.error('Please enter email and password', 'Validation');
      return;
    }
    const user = this.usersService.findByCredentials(fv.userEmail, fv.userPassword);
    if (!user) {
      this.toastr.error('Invalid email or password', 'Sign in failed');
      return;
    }
    sessionStorage.setItem('user_session_id', String(user.id));
    sessionStorage.setItem('role', user.role);
    if (user.role === 'admin') {
      this.router.navigateByUrl('/admin/catalog');
    } else {
      this.router.navigateByUrl('/');
    }
  }

}
