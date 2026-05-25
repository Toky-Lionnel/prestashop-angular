import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserCartService } from '../../services/service/user-cart/user-cart.service';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-input-duplicata',
  standalone : true,
  imports: [CommonModule,FormsModule],
  templateUrl: './input-duplicata.component.html',
  styleUrl: './input-duplicata.component.scss'
})
export class InputDuplicataComponent {

  private dialogRef = inject(MatDialogRef<InputDuplicataComponent>,{ optional: true });

  formData = {
    nombres: '',
  };

  private userCartService : UserCartService = inject(UserCartService);
  private router : Router = inject(Router);

  onSubmit() {
    this.userCartService.setNombreDuplicatas(Number(this.formData.nombres));
    this.router.navigate(['/validation']);
    this.dialogRef?.close();
  }

}
