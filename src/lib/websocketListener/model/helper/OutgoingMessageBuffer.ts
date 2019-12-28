import {Socket} from "net";
import {composeWebsocketFrame} from "../../util/websocket-utils";
import {isPromise} from "../../../utils/is-promise";
import {DataFrame} from "../../data/DataFrame";
import {ExecutionQueue} from "ugd10a";
import {debug} from "../WebsocketClientConnection";

export class OutgoingMessageBuffer {

    private readonly queue = new ExecutionQueue();

    constructor(private readonly socket: Socket) {
    }

    async write(data: DataFrame | DataFrame[] | Promise<DataFrame | DataFrame[]>): Promise<void> {
        const {queue: {enqueue}} = this;
        await enqueue(async () => this.sendData(isPromise(data) ? await data : data));
    }

    private async sendData(data: DataFrame | DataFrame[]): Promise<void> {
        const {socket} = this;
        for (const frame of Array.isArray(data) ? data : [data]) {
            if (!socket.writable) {
                console.log('Skipping some frames as socket.writable eq false');
                continue;
            }

            debug && console.log('>> sendData', frame.payload.length, 'bytes', frame);
            const renderedFrame = composeWebsocketFrame(frame);
            const flushed = socket.write(renderedFrame, err => {
                err && console.log('socket.write err', err)
            });
            if (!flushed) {
                await new Promise(resolve => socket.once("drain", resolve));
            }
        }
    }
}
