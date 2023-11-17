export interface VatGroup {
    vatRate: number;
    netto: number;
    vat: number;
    brutto: number;
  }

  export interface VatOption {
    label: '23%' | '17%' | '8%' | 'ZW',
    value: 23 | 17 | 8 | 0
  }