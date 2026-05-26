import { inject, Injectable } from "@angular/core";
import { AuthService } from "../../service/auth/auth.service";
import { Router } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { SessionService } from "../../service/session/session.service";
import { CustomerService } from "../../service/customer/customer.service";
import bcrypt from 'bcryptjs';

@Injectable({
  providedIn: "root",
})
export class AuthFacadeService {

  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);
  private sessionService : SessionService = inject(SessionService);
  private customerService : CustomerService = inject(CustomerService);

  errorMessage = '';

  constructor() {}

  async login(email: string, password: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.authService.login(email, password)
      );

      const responseBody = this.normalizeLoginResponse(response);

      if (responseBody?.hasErrors) {
        this.errorMessage = responseBody.errors?.[0] || 'Email ou mot de passe incorrect.';
        return false;
      }

      this.sessionService.setUser(email);

      this.errorMessage = '';
      await this.router.navigate(['/remove-stock']);
      return true;
    } catch (err: any) {
      console.error('Erreur', err);
      this.errorMessage = err?.error?.errors?.[0] || err?.error?.message || 'Email ou mot de passe incorrect.';
      return false;
    }
  }

  async isloginValid(email: string, password: string): Promise<boolean> {
    return this.login(email, password);
  }

  private normalizeLoginResponse(response: any): { hasErrors?: boolean; errors?: string[]; redirect?: string } | null {
    const payload = response?.data ?? response;

    if (typeof payload === 'string') {
      try {
        return JSON.parse(payload);
      } catch {
        return null;
      }
    }

    if (payload && typeof payload === 'object') {
      return payload;
    }

    return null;
  }

  async loginCustomer(email: string, password: string): Promise<boolean> {
    const customer = await this.customerService.getCustomerByEmail(email);

    if (!customer) {
      console.log('Email ou mot de passe incorrect.');
      return false;
    }
    const passwordHash = customer?.passwd?.[0];
    const isPasswordValid = bcrypt.compareSync(password, passwordHash);

    if (!isPasswordValid) {
      console.log('Email ou mot de passe incorrect.');
      return false;
    }

    this.sessionService.setCustomer(customer);
    return true;
  }

}
