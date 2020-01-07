import {Event} from "qft";

export class SyntheticEvent<T extends Event> extends Event<Event> {

    constructor(readonly type: string, readonly source: T) {
        super(type, source);
    }
}

export const syntheticEventType = (...nameParts: any[]) => `syntheticEvent:${JSON.stringify(nameParts)}`;
