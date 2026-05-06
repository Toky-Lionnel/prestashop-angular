import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PayementOrder } from '../../models/payement-order.model';
import { PayementService } from '../../services/service/payment/payement.service';

@Component({
  selector: 'app-payment-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment-form.component.html',
  styleUrls: ['./payment-form.component.scss']
})
export class PaymentFormComponent implements OnInit {

  constructor() {}

  private fb : FormBuilder = inject(FormBuilder);
  private payementService : PayementService = inject(PayementService);



  response : any;
  paymentForm !: FormGroup;

  currencies = [
    { id: 1, name: 'Ariary' },
    { id: 2, name: 'Euro' }
  ];


  ngOnInit() {
    this.paymentForm = this.fb.group({
      order_reference: ['', Validators.required],
      id_currency: [1, Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      payment_method: ['', Validators.required],
      transaction_id: ['']
    });
  }

  submit() {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }
    const payload: PayementOrder = this.paymentForm.value;

    this.payementService.createPayment(payload).then(result => {
      this.response = result;
    }).catch(error => {
      console.error('Error submitting payment', error);
    });
  }

}
