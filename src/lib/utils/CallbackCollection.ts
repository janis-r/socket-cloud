import {realpath} from "fs";

export class CallbackCollection<T> {

    private readonly callbacks = new Set<Callback<T>>();

    constructor() {
        this.polymorph = this.polymorph.bind(this);
    }

    readonly add = (callback: Callback<T>): { success: boolean, once?: () => void } => {
        const {callbacks} = this;
        if (callbacks.has(callback)) {
            return {success: false};
        }
        callbacks.add(callback);
        return {success: true, once: () => this.remove(callback)};
    };

    readonly has = (callback: Callback<T>) => this.callbacks.has(callback);

    readonly remove = (callback: Callback<T>): boolean => {
        const {callbacks} = this;
        if (callbacks.has(callback)) {
            return false;
        }
        callbacks.delete(callback);
        return true;
    };

    /**
     * Add callback to collection
     * @param callback
     */
    polymorph(callback: Callback<T>): { success: boolean, once?: () => void };
    /**
     * If no callback is specified proceed to collection management methods
     */
    polymorph(): Pick<this, "has" | "remove">;
    polymorph(callback?: Callback<T>) {
        if (callback) {
            return this.add(callback);
        }
        const {has, remove} = this;
        return {has, remove};
    }

    readonly execute = (data: T): number => {
        const {callbacks} = this;
        [...callbacks].forEach(callback => callback(data));
        return callbacks.size;
    };

}

type Callback<T> = (data: T) => unknown;
