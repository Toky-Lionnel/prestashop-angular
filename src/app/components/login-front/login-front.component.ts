import { Component, Inject, inject, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from '../../services/service/auth/auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthFacadeService } from '../../services/facade/authFacade/auth-facade.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './login-front.component.html',
  styleUrl: './login-front.component.scss'
})

export class LoginFrontComponent {

  @Input() redirectUrl: string = '';

  loginForm: FormGroup;
  errorMessage: string = '';

  private authFacade: AuthFacadeService = inject(AuthFacadeService);
  private router: Router = inject(Router);
  private dialogRef = inject(MatDialogRef<LoginFrontComponent>);

  constructor(
      private fb: FormBuilder,
      @Inject(MAT_DIALOG_DATA)
      public data: { redirectUrl?: string }
    ) {
      this.loginForm = this.fb.group({
        email: ['toky@gmail.com'],
        password: ['dislOcoeur04*']
      });
    }

  async onLogin() {
    const { email, password } = this.loginForm.value;
    this.errorMessage = '';

    const success = await this.authFacade.loginCustomer(email!, password!);

    if (!success) {
      this.errorMessage =
        this.authFacade.errorMessage ||
        'Email ou mot de passe incorrect.';
      return;
    }

    await this.router.navigate([this.data.redirectUrl]);
    this.dialogRef.close();
  }
}
