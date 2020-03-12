import {Socket} from "net";
import {ExecutionQueue} from "ugd10a";
import {composeWebsocketFrame, fragmentWebsocketFrame} from "../../util/websocket-utils";
import {isPromise} from "../../../utils/validator";
import {DataFrame} from "../../data/DataFrame";
import {WebsocketExtensionAgent} from "../../../websocketExtension";
import {debug} from "../WebsocketConnection";

export class OutgoingMessageBuffer {

    private readonly queue = new ExecutionQueue();

    constructor(private readonly socket: Socket,
                private readonly extensions: Array<WebsocketExtensionAgent>,
                private readonly fragmentSize: number) {
    }

    async write(data: DataFrame): Promise<void> {
        const {queue: {enqueue}} = this;
        await enqueue(async () => this.sendData(await this.prepareDataFrame(data)));
    }

    private async sendData(dataFrames: DataFrame[]): Promise<void> {
        const {socket} = this;
        for (const frame of dataFrames) {
            if (!socket.writable) {
                console.log('Skipping some frames as socket.writable eq false');
                continue;
            }

            debug && console.log('>> sendData', frame.payload.length, 'bytes', frame);
            const renderedFrame = composeWebsocketFrame(frame);
            const flushed = socket.write(renderedFrame, err => {
                err && debug && console.log('socket.write err', err)
            });
            if (!flushed) {
                await new Promise(resolve => socket.once("drain", resolve));
            }
        }
    }

    private async prepareDataFrame(dataFrame: DataFrame): Promise<DataFrame[]> {
        return fragmentWebsocketFrame(
            await this.extendOutgoingData(dataFrame),
            this.fragmentSize
        );
    }

    private async extendOutgoingData(data: DataFrame): Promise<DataFrame> {
        const {extensions} = this;
        if (!extensions || extensions.length === 0) {
            return data;
        }

        for (const extension of extensions) {
            const transformation = extension.outgoingDataPipe(data);
            data = isPromise(transformation) ? await transformation : transformation;
        }

        return data;
    }
}
