import { inject, Injectable } from "@angular/core";
import { AuthService } from "../../service/auth/auth.service";
import { Router } from "@angular/router";
import { firstValueFrom } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class AuthFacadeService {
  errorMessage: string = "";

  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);

  constructor() {}

  async login(email: string, password: string) {
    try {
      const response = await firstValueFrom(
        this.authService.login(email, password)
      );

      console.log("Connexion réussie", response);
      this.errorMessage = "";

      this.router.navigate(["/accueil"]);
    } catch (err: any) {
      console.error("Erreur", err);
      this.errorMessage =
        err.error?.message || "Email ou mot de passe incorrect.";
    }
  }

  async logout() {
    try {
      await firstValueFrom(this.authService.logout());
    } catch (err: any) {
      console.error("Erreur logout", err);
    } finally {
      this.authService.clearClientAuthState();
      this.errorMessage = "";
      this.router.navigate(["/"]);
    }
  }
}
