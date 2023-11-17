import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Observable, Subscription, of } from 'rxjs';
import { VatGroup } from './models/vat-group.interface';

interface Summary {
  totalNetto?: number,
  totalVat?: number,
  totalBrutto?: number,
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  form!: FormGroup;
  formValue = {};
  summary: Summary = {
    totalNetto: 0,
    totalVat: 0,
    totalBrutto:0
  }
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      nip: ['', {
        validators: [Validators.required, Validators.minLength(7), Validators.maxLength(9), Validators.pattern("^[0-9]*$"),
        ]
      }],
      email: ['', Validators.email],
      paymentDate: [new Date(), Validators.required, this.dateNotInPastValidator(7)],
      singleVatGroup: null,
      vatGroupList: this.fb.array([new FormControl()])
    })
    this.formValue = this.form.value;
    this.subscriptions.push(
      this.form.valueChanges.subscribe(value => { 
      this.formValue = value;
      this.updateSummary();     
    })
    )
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe())
  }

  get vatGroupList() {
    return this.form.controls['vatGroupList'] as FormArray;
  }

  addVatGroup(): void {
    const vatGroup = new FormControl();
    this.vatGroupList.push(vatGroup)
  }

  removeVatGroup(index: number) {
    this.vatGroupList.removeAt(index);
  }

  onSubmit(): void {
    if (this.form.valid) {
      alert(JSON.stringify(this.formValue));
    } else {
      alert('Form invalid');
    }
  }


  getNipErrorMessage(): string {
    const control = this.form.get('nip');
    if (control?.hasError('required')) {
      return 'You must enter a value';
    }
    if (control?.hasError('pattern')) {
      return 'NIP must consist of digits only';
    }
    const minLength = control?.getError('minlength')?.requiredLength;
    const maxLength = control?.getError('maxlength')?.requiredLength;

    const errorMessage =
      (minLength && maxLength) ? `NIP must be between ${minLength} and ${maxLength} characters long` :
        minLength ? `NIP must be at least ${minLength} characters long` :
          maxLength ? `NIP cannot be longer than ${maxLength} characters` :
            '';

    return errorMessage || (control?.hasError('nip') ? 'Not a valid NIP' : '');
  }

  getEmailErrorMessage(): string {
    const control = this.form.get('email');
    if (control?.hasError('required')) {
      return 'You must enter an email';
    }
    if (control?.hasError('email')) {
      return 'Not a valid email address';
    }
    return '';
  }

  getPaymentDateErrorMessage(): string {
    const control = this.form.get('paymentDate');
    if (control?.hasError('required')) {
      return 'You must enter an email address';
    }
    if (control?.hasError('dateOutOfRange')) {
      return 'Select a date later than 7 days from today';
    }
    return '';
  }


  setExampleValueForForm(): void {
    // fill the form with data (for example if theyre from API)
    const nip = this.form.get('nip');
    const email = this.form.get('email');
    const singleVatGroup = this.form.get('singleVatGroup');
    const vatGroupList = this.form.get('vatGroupList');

    const exampleVatData: VatGroup[] = [
      { vatRate: 17, netto: 100, vat: 17, brutto: 117 },
      { vatRate: 8, netto: 200, vat: 16, brutto: 216 },
      { vatRate: 0, netto: 100, vat: 0, brutto: 100 },
      { vatRate: 23, netto: 100, vat: 23, brutto: 123 }];

    nip?.setValue('123456789');
    email?.setValue('example@exam.com');
    singleVatGroup?.setValue(exampleVatData[0]);

    (vatGroupList as FormArray)?.clear();
    const newFormControls: FormControl[] = [
      new FormControl(exampleVatData[0]),
      new FormControl(exampleVatData[1]),
      new FormControl(exampleVatData[2]),
      new FormControl(exampleVatData[3]),
    ];

    newFormControls.forEach(control => (vatGroupList as FormArray)?.push(control));
  }


private updateSummary():void {
  const formValue = this.form.value;
  let totalNetto = 0;
  let totalVat = 0;
  let totalBrutto = 0;

  // Obsługa singleVatGroup
  if (formValue.singleVatGroup) {
    totalNetto += formValue.singleVatGroup.netto;
    totalVat += formValue.singleVatGroup.vat;
    totalBrutto += formValue.singleVatGroup.brutto;
  }

  // Obsługa vatGroupList
  if (formValue.vatGroupList && formValue.vatGroupList.length > 0) {
    formValue.vatGroupList.forEach((group: any) => {
      totalNetto += group.netto;
      totalVat += group.vat;
      totalBrutto += group.brutto;
    });
  }

  this.summary = { totalNetto, totalVat, totalBrutto };  
}

 private dateNotInPastValidator(daysFromToday: number): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const selectedDate = new Date(control.value);

      if (isNaN(selectedDate.getTime())) {
        return of({ invalidDate: true });
      }

      const currentDate = new Date();
      const futureDate = new Date();
      futureDate.setDate(currentDate.getDate() + daysFromToday);

      if (selectedDate < futureDate) {
        return of({ dateOutOfRange: { daysFromToday } });
      }

      return of(null);
    };
  }
}