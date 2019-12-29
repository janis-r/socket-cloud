import {DataFrame} from "../../data/DataFrame";
import {DataFrameType} from "../../data/DataFrameType";
import {CallbackCollection} from "../../../utils/CallbackCollection";
import {WebsocketDataBuffer} from "../../util/WebsocketDataBuffer";

export class IncomingMessageBuffer {

    private readonly dataBuffer = new WebsocketDataBuffer();
    private readonly queue = new Array<DataFrame>();

    private readonly dataCallback = new CallbackCollection<DataFrame>();
    private readonly errorCallback = new CallbackCollection<string>();

    readonly onData = this.dataCallback.polymorph;
    readonly onError = this.errorCallback.polymorph;

    constructor() {
        this.dataBuffer.onData(this.validateDataFrame);
    }

    readonly write = (chunk: Buffer) => {
        try {
            this.dataBuffer.write(chunk);
        } catch (e) {
            this.errorCallback.execute(e.message);
        }
    };

    destroy(): void {
        this.dataBuffer.destroy();
    }

    private readonly validateDataFrame = (dataFrame: DataFrame) => {
        const {queue, dataCallback: {execute: dispatchFrame}, errorCallback: {execute: dispatchError}} = this;
        const {ContinuationFrame, TextFrame, BinaryFrame, ConnectionClose, Ping, Pong} = DataFrameType;

        const {type, isFinal, rsv1, rsv2, rsv3} = dataFrame;
        const controlFrame = isControlFrame(type);

        if (![ContinuationFrame, TextFrame, BinaryFrame, ConnectionClose, Ping, Pong].includes(dataFrame.type)) {
            dispatchError(`Unknown frame type ${dataFrame.type} received`);
            return;
        }

        if (!isFinal && controlFrame) {
            dispatchError(`Received fragmented message that should never be fragmented ${JSON.stringify(dataFrame)}`);
            return;
        }

        if ([rsv1, rsv2, rsv3].includes(true) && controlFrame) {
            dispatchError(`Enabled RSV fields on control frames seem to be an error: ${JSON.stringify(dataFrame)}`);
            return;
        }

        if (controlFrame) {
            // Rest of checks are applied to message frames
            dispatchFrame(dataFrame);
            return;
        }

        if (queue.length === 0 && type === ContinuationFrame) {
            dispatchError(`Received continuation frame with not preceding opening frame: ${JSON.stringify(dataFrame)}`);
            return;
        }

        if (queue.length > 0 && type !== ContinuationFrame) {
            dispatchError(`Received double opening frames: ${JSON.stringify(dataFrame)}`);
            return;
        }

        if (isFinal && queue.length === 0) {
            dispatchFrame(dataFrame);
            return;
        }

        queue.push(dataFrame);
        if (!isFinal) {
            return;
        }

        const aggregatedFrameData = {
            ...queue[0],
            isFinal: true,
            payload: Buffer.concat(queue.map(({payload}) => payload))
        };

        queue.length = 0;
        dispatchFrame(aggregatedFrameData);
    }
}

const isControlFrame = (type: DataFrameType) => ![
    DataFrameType.TextFrame,
    DataFrameType.BinaryFrame,
    DataFrameType.ContinuationFrame
].includes(type);
