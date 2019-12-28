import {CallbackCollection} from "./CallbackCollection";

describe('CallbackCollection', () => {
    it('Can add and execute callbacks', () => {
        const collection = new CallbackCollection<boolean>();
        let counter = 0;
        const callbacks  = [
            () => counter++,
            () => counter++,
            () => counter++,
        ];
        callbacks.forEach(callback => collection.add(callback));
        collection.execute(true);
        expect(counter).toBe(callbacks.length);
    });
    it(`Double adding of callback ain't gonna make callback execute twice`, () => {
        const collection = new CallbackCollection<boolean>();
        let counter = 0;
        const callbacks  = [
            () => counter++,
            () => counter++,
            () => counter++,
        ];
        callbacks.forEach(callback => collection.add(callback));
        callbacks.forEach(callback => collection.add(callback));
        const executedCount = collection.execute(true);
        expect(counter).toBe(callbacks.length);
        expect(executedCount).toBe(callbacks.length);
    });
});
