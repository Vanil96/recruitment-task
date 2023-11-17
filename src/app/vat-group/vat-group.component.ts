import { Component, OnDestroy, OnInit, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormBuilder, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { VatGroup, VatOption } from '../models/vat-group.interface';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-vat-group',
  templateUrl: './vat-group.component.html',
  styleUrls: ['./vat-group.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VatGroupComponent),
      multi: true
    }
  ]
})
export class VatGroupComponent implements ControlValueAccessor, OnInit, OnDestroy {
  formGroup!: FormGroup;
  vatOptions: VatOption[] = [
    { label: '23%', value: 23 },
    { label: '17%', value: 17 },
    { label: '8%', value: 8 },
    { label: 'ZW', value: 0 }
  ]
  private subscriptions: Subscription[] = [];
  value: VatGroup = { vatRate: 0, netto: 0, vat: 0, brutto: 0 };

  onChange: any = () => { };
  onTouch: any = () => { };

  constructor(private fb: FormBuilder) {
    this.formGroup = this.fb.group({
      vatRate: 23,
      netto: 0,
      vat: 0,
      brutto: 0
    })
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.formGroup.valueChanges.subscribe(value => {
        this.value = value;
      })
    )
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe())
  }

  writeValue(value: VatGroup): void {
    if (value) {
      this.setFormValue(value);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  onInputsChange(field: keyof VatGroup): void {
    this.calculateValues(field);
    this.setFormValue(this.value);
    this.onChange(this.value);
    this.onTouch();
  }

  private setFormValue(value: VatGroup) {
    this.formGroup.get('vatRate')?.setValue(value.vatRate);
    this.formGroup.get('netto')?.setValue(value.netto);
    this.formGroup.get('vat')?.setValue(value.vat);
    this.formGroup.get('brutto')?.setValue(value.brutto);
  }

  private calculateValues(updatedFieldKey: keyof VatGroup) {
    const { vatRate, netto, vat, brutto } = this.value;
    if (vatRate === 0) {
      this.value.vat = 0;
      this.formGroup.get('vat')?.disable();
    } else {
      this.formGroup.get('vat')?.enable();
    }

    switch (updatedFieldKey) {
      case 'vatRate':
        this.value.vat = +(netto * (vatRate / 100)).toFixed(2);
        this.value.brutto = +(netto + this.value.vat).toFixed(2);
        break;

      case 'netto':
        this.value.vat = +(netto * (vatRate / 100)).toFixed(2);
        this.value.brutto = +(netto + this.value.vat).toFixed(2);
        break;

      case 'vat':
        this.value.netto = +(vat / (vatRate / 100)).toFixed(2);
        this.value.brutto = +(this.value.netto + vat).toFixed(2);
        break;

      case 'brutto':
        this.value.netto = +(brutto / (1 + vatRate / 100)).toFixed(2);
        this.value.vat = +(brutto - this.value.netto).toFixed(2);
        break;

      default:
        break;
    }
  }
}



