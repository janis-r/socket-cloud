export class ExecutionQueue {

    private readonly queue = new Array<EnqueuedAction>();

    readonly enqueue = async (action: Action) => new Promise<ReturnType<Action>>((resolve, reject) => {
        const {queue} = this;
        queue.push(
            async () => {
                try {
                    const response = await action();
                    resolve(response);
                    return response;
                } catch (e) {
                    reject(e);
                }
            }
        );

        if (queue.length === 1) {
            this.executeNext();
        }
    });


    private async executeNext() {
        const {queue} = this;
        if (queue.length === 0) {
            return;
        }

        await queue[0]();
        queue.shift();
        this.executeNext();
    }

}

type Action = () => any | Promise<any>;
type EnqueuedAction = () => Promise<ReturnType<Action>>
