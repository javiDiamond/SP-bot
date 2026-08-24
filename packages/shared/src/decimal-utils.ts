import Decimal from 'decimal.js';

export class DecimalUtils {
  static parse(value: string | number | Decimal): Decimal {
    return new Decimal(value);
  }

  static add(a: string | number, b: string | number): string {
    return new Decimal(a).plus(b).toString();
  }

  static sub(a: string | number, b: string | number): string {
    return new Decimal(a).minus(b).toString();
  }

  static mul(a: string | number, b: string | number): string {
    return new Decimal(a).times(b).toString();
  }

  static div(a: string | number, b: string | number, precision: number = 8): string {
    return new Decimal(a).div(b).toDecimalPlaces(precision).toString();
  }

  static round(value: string | number, precision: number): string {
    return new Decimal(value).toDecimalPlaces(precision).toString();
  }

  static roundPrice(price: string | number, pricePrecision: number): string {
    return this.round(price, pricePrecision);
  }

  static roundQuantity(quantity: string | number, amountPrecision: number): string {
    return this.round(quantity, amountPrecision);
  }

  static min(...values: (string | number)[]): string {
    if (values.length === 0) return '0';
    return Decimal.min(...values.map(v => new Decimal(v))).toString();
  }

  static max(...values: (string | number)[]): string {
    if (values.length === 0) return '0';
    return Decimal.max(...values.map(v => new Decimal(v))).toString();
  }

  static abs(value: string | number): string {
    return new Decimal(value).abs().toString();
  }

  static isPositive(value: string | number): boolean {
    return new Decimal(value).gt(0);
  }

  static isZero(value: string | number): boolean {
    return new Decimal(value).eq(0);
  }

  static gt(a: string | number, b: string | number): boolean {
    return new Decimal(a).gt(b);
  }

  static gte(a: string | number, b: string | number): boolean {
    return new Decimal(a).gte(b);
  }

  static lt(a: string | number, b: string | number): boolean {
    return new Decimal(a).lt(b);
  }

  static lte(a: string | number, b: string | number): boolean {
    return new Decimal(a).lte(b);
  }

  static eq(a: string | number, b: string | number): boolean {
    return new Decimal(a).eq(b);
  }

  static percentChange(oldValue: string | number, newValue: string | number): string {
    const old = new Decimal(oldValue);
    const newVal = new Decimal(newValue);
    if (old.isZero()) return '0';
    return newVal.minus(old).div(old).times(100).toDecimalPlaces(4).toString();
  }
}
