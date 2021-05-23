import { uniqueValues } from "ugd10a";

export class StringParser {

    constructor(private readonly inputValue: string) {
    }

    asInt<F>({ fallback, allowNegative = false }: { fallback?: F, allowNegative?: boolean }): number | F {
        const { inputValue } = this;
        if (inputValue) {
            const value = parseInt(inputValue);
            if (!isNaN(value) && (value >= 0 || allowNegative)) {
                return value;
            }
        }
        return fallback !== undefined ? fallback : NaN;
    }

    asFloat<T>({ fallback, allowNegative = false }: { fallback?: T, allowNegative?: boolean }): number | T {
        const { inputValue } = this;
        if (inputValue) {
            const value = parseFloat(inputValue);
            if (!isNaN(value) && (value >= 0 || allowNegative)) {
                return value;
            }
        }
        return fallback !== undefined ? fallback : NaN;
    }

    asIntList({ separator = ',', unique = false }: { separator?: string, unique?: boolean }): Array<number> {
        const { inputValue } = this;
        if (!inputValue) {
            return [];
        }

        const entries = inputValue.split(separator).map(entry => parseInt(entry)).filter(entry => !isNaN(entry));
        if (!entries || !entries.length) {
            return [];
        }
        return unique ? uniqueValues(entries) : entries;
    }

    asFloatList({ separator = ',', unique = false }: { separator?: string, unique?: boolean }): Array<number> {
        const { inputValue } = this;
        if (!inputValue) {
            return [];
        }

        const entries = inputValue.split(separator).map(entry => parseFloat(entry)).filter(entry => !isNaN(entry));
        if (!entries || !entries.length) {
            return [];
        }
        return unique ? uniqueValues(entries) : entries;
    }

    asString(): string {
        return this.inputValue ? this.inputValue.trim() : "";
    }

    asBool(): boolean {
        return this.inputValue === "true";
    }
}
