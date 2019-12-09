import {Socket} from "net";

export class WebsocketOutgoingDataBuffer {

    private readonly queue = new Set<Promise<any>>();

    constructor(private readonly socket: Socket) {

    }

    async write(data: Buffer | Buffer[]): Promise<void> {
        const {queue} = this;
        const process = new Promise<void>(async resolve => {
            await Promise.all([...queue]);
            await this.sendData(data);
            resolve();
        });

        queue.add(process);
        await process;
        queue.delete(process);
    }

    private async sendData(data: Buffer | Buffer[]): Promise<void> {
        const {socket} = this;

        for (const frame of Array.isArray(data) ? data : [data]) {
            const bufferIsFull = socket.write(frame, err => {
                console.debug('>> socket wrote', frame.length, 'bytes');
                err && console.log('socket.write err', err)
            });
            if (bufferIsFull) {
                await new Promise(resolve => socket.once("drain", resolve));
            }
        }
    }
}
