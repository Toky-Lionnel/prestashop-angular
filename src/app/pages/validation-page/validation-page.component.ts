import { Component } from '@angular/core';
import { ValidationComponent } from '../../components/validation/validation.component';
import { NavbarFrontComponent } from '../../shared/navbar-front/navbar-front.component';

@Component({
  selector: 'app-validation-page',
  imports: [ValidationComponent,NavbarFrontComponent],
  templateUrl: './validation-page.component.html',
  styleUrl: './validation-page.component.scss'
})
export class ValidationPageComponent {

}
