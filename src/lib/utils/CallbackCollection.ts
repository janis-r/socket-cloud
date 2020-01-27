export class CallbackCollection<T> {

    private readonly callbacks = new Map<Callback<T>, CallbackProperties<T>>();

    constructor() {
        this.polymorph = this.polymorph.bind(this);
    }

    readonly add = (callback: Callback<T>): CallbackManager<T> => {
        const {callbacks} = this;
        if (callbacks.has(callback)) {
            return {success: false};
        }

        const callbackProps: CallbackProperties<T> = {};
        callbacks.set(callback, callbackProps);

        const onComplete = (callback: OnCompleteCallback) => callbackProps.onComplete = callback;
        const times = (count: number) => {
            callbackProps.executionLimit = count;
            return {onComplete};
        };
        const once = () => times(1);
        const twice = () => times(2);
        const filter = (func: FilterFunction<T>) => {
            callbackProps.filter = func;
            return {once, twice, times};
        };

        return {success: true, filter, once, twice, times};
    };

    readonly has = (callback: Callback<T>) => this.callbacks.has(callback);

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
    polymorph(callback: Callback<T>): CallbackManager<T>;
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
        let executed = 0;
        for (const [callback, properties] of callbacks) {
            if (properties.filter && !properties.filter(data)) {
                continue;
            }

            callback(data);
            executed++;
            if (properties.executionLimit) {
                if (!properties.executionCount) {
                    properties.executionCount = 1;
                } else {
                    properties.executionCount++;
                }
                if (properties.executionCount === properties.executionLimit) {
                    if (properties.onComplete) {
                        properties.onComplete();
                    }
                    callbacks.delete(callback);
                }
            }
        }

        return executed;
    };
}

type Callback<T> = (data: T) => unknown;
type FilterFunction<T> = (data: T) => boolean
type OnCompleteCallback = () => void;
type CallbackProperties<T> = {
    executionLimit?: number,
    executionCount?: number,
    filter?: FilterFunction<T>,
    onComplete?: OnCompleteCallback
};
export type CallbackManager<T> = {
    success: boolean;
    filter?: (func: FilterFunction<T>) => Pick<CallbackManager<T>, "once" | "twice" | "times">;
    once?: () => { onComplete: (callback: OnCompleteCallback) => void };
    twice?: () => { onComplete: (callback: OnCompleteCallback) => void };
    times?: (count: number) => { onComplete: (callback: OnCompleteCallback) => void };
};
