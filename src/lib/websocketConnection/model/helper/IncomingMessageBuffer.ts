import {DataFrame} from "../../data/DataFrame";
import {DataFrameType} from "../../data/DataFrameType";
import {CallbackCollection} from "../../../utils/CallbackCollection";
import {WebsocketDataBuffer} from "../../util/WebsocketDataBuffer";
import {WebsocketExtensionAgent} from "../../../websocketExtension";
import {isPromise} from "../../../utils/is-promise";
import {ExecutionQueue} from "ugd10a";
import {CloseCode} from "../../data/CloseCode";

const isValidUTF8: (data: Buffer) => boolean = require('utf-8-validate');

export class IncomingMessageBuffer {

    private readonly dataBuffer = new WebsocketDataBuffer();
    private readonly queue = new Array<DataFrame>();
    private readonly postProcessingQueue = new ExecutionQueue();

    private readonly dataCallback = new CallbackCollection<DataFrame>();
    private readonly errorCallback = new CallbackCollection<{ message: string, code: CloseCode }>();

    readonly onData = this.dataCallback.manage;
    readonly onError = this.errorCallback.manage;

    constructor(readonly extensions: Array<WebsocketExtensionAgent>) {
        this.dataBuffer.onData(this.validateDataFrame);
    }

    readonly write = (chunk: Buffer) => {
        const {dataBuffer, errorCallback} = this;
        try {
            dataBuffer.write(chunk);
        } catch (e) {
            errorCallback.execute(e.message);
        }
    };

    destroy(): void {
        this.dataBuffer.destroy();
    }

    private readonly validateDataFrame = (dataFrame: DataFrame): void => {
        const {queue, errorCallback: {execute: dispatchError}} = this;
        const {ContinuationFrame, TextFrame, BinaryFrame, ConnectionClose, Ping, Pong} = DataFrameType;
        const {ProtocolError} = CloseCode;

        const {type, isFinal, rsv1, rsv2, rsv3} = dataFrame;
        const controlFrame = isControlFrame(type);

        if (![ContinuationFrame, TextFrame, BinaryFrame, ConnectionClose, Ping, Pong].includes(dataFrame.type)) {
            dispatchError({
                message: `Unknown frame type ${dataFrame.type}`,
                code: ProtocolError
            });
            return;
        }

        if (!isFinal && controlFrame) {
            dispatchError({
                message: `Control frames cannot be fragmented: ${dumpDataFrame(dataFrame)}`,
                code: ProtocolError
            });
            return;
        }

        if ([rsv1, rsv2, rsv3].includes(true) && controlFrame) {
            dispatchError({
                message: `RSV fields must be empty on control frames: ${dumpDataFrame(dataFrame)}`,
                code: ProtocolError
            });
            return;
        }

        if (controlFrame) {
            // Rest of checks are applied to message frames
            this.postProcessFrame(dataFrame);
            return;
        }

        if (queue.length === 0 && type === ContinuationFrame) {
            dispatchError({
                message: `Received continuation frame with not preceding opening frame: ${dumpDataFrame(dataFrame)}`,
                code: ProtocolError
            });
            return;
        }

        if (queue.length > 0 && type !== ContinuationFrame) {
            dispatchError({
                message: `Received double opening frames: ${dumpDataFrame(dataFrame)}`,
                code: ProtocolError
            });
            return;
        }

        if (isFinal && queue.length === 0) {
            this.postProcessFrame(dataFrame);
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
        this.postProcessFrame(aggregatedFrameData);
    };

    private async postProcessFrame(dataFrame: DataFrame): Promise<void> {
        const {
            dataCallback: {execute: dispatchFrame},
            errorCallback: {execute: dispatchError},
            postProcessingQueue: {enqueue}
        } = this;
        const {ProtocolError, InvalidFramePayloadData, InternalServerError} = CloseCode;

        try {
            const processedFrame = await enqueue(() => this.extendIncomingData(dataFrame));
            const {type, payload, rsv1, rsv2, rsv3} = processedFrame;
            if ([rsv1, rsv2, rsv3].includes(true)) {
                dispatchError({
                    message: `RSV fields must be empty: ${dumpDataFrame(dataFrame)}`,
                    code: ProtocolError
                });
                return;
            }

            if (type === DataFrameType.TextFrame && !isValidUTF8(payload)) {
                dispatchError({
                    message: `Received invalid UTF8 content: ${dumpDataFrame(dataFrame)}`,
                    code: InvalidFramePayloadData
                });
                return;
            }

            dispatchFrame(processedFrame);
        } catch (e) {
            dispatchError({
                message: `Error while post-processing incoming data: ${JSON.stringify(e)}`,
                code: InternalServerError
            });
        }
    }

    private async extendIncomingData(data: DataFrame): Promise<DataFrame> {
        const {extensions} = this;
        if (!extensions || extensions.length === 0) {
            return data;
        }

        for (const extension of extensions) {
            const transformation = extension.incomingDataPipe(data);
            data = isPromise(transformation) ? await transformation : transformation;
        }
        return data;
    }
}

const isControlFrame = (type: DataFrameType) => ![
    DataFrameType.TextFrame,
    DataFrameType.BinaryFrame,
    DataFrameType.ContinuationFrame
].includes(type);

const dumpDataFrame = (dataFrame: DataFrame) => {
    const lengthLimit = 200;
    const asStr = JSON.stringify(dataFrame);
    if (asStr.length < lengthLimit) {
        return asStr;
    }
    return `${asStr.slice(0, lengthLimit)}...`;
};
