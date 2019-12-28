import {DataFrame} from "../../data/DataFrame";
import {DataFrameType} from "../../data/DataFrameType";
import {CallbackCollection} from "../../../utils/CallbackCollection";
import {IncomingDataBuffer} from "./IncomingDataBuffer";

export class IncomingMessageManager {

    private readonly dataBuffer = new IncomingDataBuffer();
    private readonly queue = new Array<DataFrame>();

    private readonly dataCallback = new CallbackCollection<DataFrame>();
    private readonly errorCallback = new CallbackCollection<string>();

    readonly onData = this.dataCallback.polymorph;
    readonly onError = this.errorCallback.polymorph;

    constructor() {
        this.dataBuffer.onData(this.validateDataFrame);
    }

    readonly write = (chunk: Buffer) => this.dataBuffer.write(chunk);

    private readonly validateDataFrame = (dataFrame: DataFrame) => {
        const {queue, dataCallback, errorCallback: {execute: sendError}} = this;
        const {ContinuationFrame, TextFrame, BinaryFrame, ConnectionClose, Ping, Pong} = DataFrameType;

        const {type, isFinal, rsv1, rsv2, rsv3} = dataFrame;
        const controlFrame = isControlFrame(type);

        if (![ContinuationFrame, TextFrame, BinaryFrame, ConnectionClose, Ping, Pong].includes(dataFrame.type)) {
            sendError(`Unknown frame type ${dataFrame.type} received`);
            return;
        }

        if (!isFinal && controlFrame) {
            sendError(`Received fragmented message that should never be fragmented ${JSON.stringify(dataFrame)}`);
            return;
        }

        if ([rsv1, rsv2, rsv3].includes(true) && controlFrame) {
            sendError(`Enabled RSV fields on control frames seem to be an error: ${JSON.stringify(dataFrame)}`);
            return;
        }

        if (controlFrame) {
            // Rest of checks are applied to message frames
            dataCallback.execute(dataFrame);
            return;
        }

        if (queue.length === 0 && type === ContinuationFrame) {
            sendError(`Received continuation frame with not preceding opening frame: ${JSON.stringify(dataFrame)}`);
            return;
        }

        if (queue.length > 0 && type !== ContinuationFrame) {
            sendError(`Received double opening frames: ${JSON.stringify(dataFrame)}`);
            return;
        }

        if (isFinal && queue.length === 0) {
            dataCallback.execute(dataFrame);
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
        dataCallback.execute(aggregatedFrameData);
    }
}

const isControlFrame = (type: DataFrameType) => ![
    DataFrameType.TextFrame,
    DataFrameType.BinaryFrame,
    DataFrameType.ContinuationFrame
].includes(type);
