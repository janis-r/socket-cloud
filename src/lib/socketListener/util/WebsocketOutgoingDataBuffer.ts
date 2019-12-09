import {Socket} from "net";
import {decomposeWebSocketFrame} from "./websocket-utils";

export class WebsocketOutgoingDataBuffer {

    private readonly queue = new Set<Promise<any>>();

    constructor(private readonly socket: Socket) {

    }

    async write(data: Buffer | Buffer[], id?: string): Promise<void> {
        const {queue} = this;
        const process = new Promise<void>(async resolve => {
            // console.log(`>> write [${id}] -> Promise.all`);
            await Promise.all([...queue]);
            // console.log(`>> write [${id}] -> sendData`);
            await this.sendData(data);
            // console.log(`>> write [${id}] -> sendData done`);
            resolve();
        });

        queue.add(process);
        await process;
        queue.delete(process);
    }

    private async sendData(data: Buffer | Buffer[]): Promise<void> {
        const {socket} = this;
        for (const frame of Array.isArray(data) ? data : [data]) {
            if (!socket.writable) {
                console.log('Skipping some frames as socket.writable eq false');
                continue;
            }

            console.log('>> sendData', decomposeWebSocketFrame(frame));
            const canProceed = socket.write(frame, err => {
                console.debug('>> socket wrote', frame.length, 'bytes');
                err && console.log('socket.write err', err)
            });
            console.log({canProceed});
            if (!canProceed) {
                await new Promise(resolve => socket.once("drain", resolve));
            }
        }
    }
}
