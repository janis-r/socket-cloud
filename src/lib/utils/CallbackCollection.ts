export class CallbackCollection<T> {

    private readonly callbacks = new Set<Callback<T>>();
    private readonly forwardedCallbacks = new Map<Callback<T>, Callback<T>>();

    constructor() {
        this.polymorph = this.polymorph.bind(this);
    }

    readonly add = (callback: Callback<T>): { success: boolean, once?: () => void, times?: (count: number) => void } => {
        const {callbacks} = this;
        if (callbacks.has(callback)) {
            return {success: false};
        }

        callbacks.add(callback);
        return {
            success: true,
            once: () => this.limitExecutionTimes(callback, 1),
            times: (count: number) => this.limitExecutionTimes(callback, count)
        };
    };

    readonly has = (callback: Callback<T>) => this.callbacks.has(callback) || this.forwardedCallbacks.has(callback);

    readonly remove = (callback: Callback<T>): boolean => {
        const {callbacks} = this;
        if (callbacks.has(callback)) {
            callbacks.delete(callback);
            return true;
        }
        return false;
    };

    /**
     * Add callback to collection
     * @param callback
     */
    polymorph(callback: Callback<T>): { success: boolean, once?: () => void, times?: (count: number) => void };
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

    private limitExecutionTimes(callback: Callback<T>, times: number): void {
        const {callbacks, forwardedCallbacks} = this;

        let executedTimes = 0;

        if (forwardedCallbacks.has(callback)) {
            callbacks.delete(forwardedCallbacks.get(callback));
            forwardedCallbacks.delete(callback)
        }

        const controlCallback = (data: T) => {
            executedTimes++;
            if (executedTimes === times) {
                callbacks.delete(controlCallback);
                forwardedCallbacks.delete(callback);
            }
            callback(data);
        };

        callbacks.delete(callback);
        forwardedCallbacks.set(callback, controlCallback);
        callbacks.add(controlCallback);
    }

}

type Callback<T> = (data: T) => unknown;
