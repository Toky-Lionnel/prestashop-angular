import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from '../../services/service/auth/auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthFacadeService } from '../../services/facade/authFacade/auth-facade.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html'
})


export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';


  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private authFacade: AuthFacadeService) {
    this.loginForm = this.fb.group({
      email: ['tokyrajaonarivony@gmail.com'],
      password: ['dislOcoeur04*']
    });
  }

  async onLogin() {
    const { email, password } = this.loginForm.value;
    this.errorMessage = '';
    await this.authFacade.login(email!, password!);
    this.errorMessage = this.authFacade.errorMessage;
  }



}
