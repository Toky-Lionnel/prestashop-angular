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
    templateUrl: './login-front.component.html',
  styleUrl: './login-front.component.scss'
})

export class LoginFrontComponent {

  loginForm: FormGroup;
  errorMessage: string = '';

  private authFacade: AuthFacadeService = inject(AuthFacadeService);

  constructor(private fb : FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['tokyrajaonarivony@gmail.com'],
      password: ['dislOcoeur04*']
    });
  }

  async onLogin() {
    const { email, password } = this.loginForm.value;
    this.errorMessage = '';

    const success = await this.authFacade.loginCustomer(email!, password!);
    if (!success) {
      this.errorMessage = this.authFacade.errorMessage || 'Email ou mot de passe incorrect.';
    }

  }


}
