import Decimal from 'decimal.js';
export declare class DecimalUtils {
    static parse(value: string | number | Decimal): Decimal;
    static add(a: string | number, b: string | number): string;
    static sub(a: string | number, b: string | number): string;
    static mul(a: string | number, b: string | number): string;
    static div(a: string | number, b: string | number, precision?: number): string;
    static round(value: string | number, precision: number): string;
    static roundPrice(price: string | number, pricePrecision: number): string;
    static roundQuantity(quantity: string | number, amountPrecision: number): string;
    static min(...values: (string | number)[]): string;
    static max(...values: (string | number)[]): string;
    static abs(value: string | number): string;
    static isPositive(value: string | number): boolean;
    static isZero(value: string | number): boolean;
    static gt(a: string | number, b: string | number): boolean;
    static gte(a: string | number, b: string | number): boolean;
    static lt(a: string | number, b: string | number): boolean;
    static lte(a: string | number, b: string | number): boolean;
    static eq(a: string | number, b: string | number): boolean;
    static percentChange(oldValue: string | number, newValue: string | number): string;
}
