import {Socket} from "net";
import {composeWebsocketFrame} from "../../util/websocket-utils";
import {isPromise} from "../../../utils/is-promise";
import {WebsocketDataFrame} from "../../data/WebsocketDataFrame";

export class WebsocketOutgoingDataBuffer {

    private readonly queue = new Set<Promise<any>>();

    constructor(private readonly socket: Socket) {
    }

    async write(data: WebsocketDataFrame | WebsocketDataFrame[] | Promise<WebsocketDataFrame | WebsocketDataFrame[]>): Promise<void> {
        const {queue} = this;
        const process = (async () => {
            await Promise.all([...queue]);
            await this.sendData(isPromise(data) ? await data : data);
        })();
        queue.add(process);
        await process;
        queue.delete(process);
    }

    private async sendData(data: WebsocketDataFrame | WebsocketDataFrame[]): Promise<void> {
        const {socket} = this;
        for (const frame of Array.isArray(data) ? data : [data]) {
            if (!socket.writable) {
                console.log('Skipping some frames as socket.writable eq false');
                continue;
            }

            console.log('>> sendData', frame);
            const renderedFrame = composeWebsocketFrame(frame);
            const flushed = socket.write(renderedFrame, err => {
                console.debug('>> socket wrote', renderedFrame.length, 'bytes');
                err && console.log('socket.write err', err)
            });
            if (!flushed) {
                await new Promise(resolve => socket.once("drain", resolve));
            }
        }
    }
}
