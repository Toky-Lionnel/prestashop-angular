import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from '../../services/service/auth/auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthFacadeService } from '../../services/facade/authFacade/auth-facade.service';
import { AxiosAuthInterceptor } from '../../interceptors/auth/AxiosAuthInterceptor';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html'
})


export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';

  private authIntereptor : AxiosAuthInterceptor = inject(AxiosAuthInterceptor);


  async ngOnInit() {
    try {
      const orders = await this.getOrders();
      console.log('Orders:', orders.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private authFacade: AuthFacadeService) {
    this.loginForm = this.fb.group({
      email: ['admin'],
      password: ['admin']
    });
  }

  onLogin() {
    const { email, password } = this.loginForm.value;
    this.authFacade.login(email!, password!);
  }


  async getOrders () {
    const api = this.authIntereptor.getApi();
    const ordres = await api.get('/webservice/dispatcher.php?url=orders');
    return ordres;
  }





}
