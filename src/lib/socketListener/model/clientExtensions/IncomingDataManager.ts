import {Event, EventDispatcher, EventListener} from "qft";
import {WebsocketDataFrame} from "../../data/WebsocketDataFrame";
import {WebsocketClientConnection} from "../WebsocketClientConnection";
import {WebsocketDataFrameType} from "../../data/WebsocketDataFrameType";
import {ConnectionState, StateChangeEvent} from "../../../socketServer";
import {WebsocketCloseCode} from "../../data/WebsocketCloseCode";

const isValidUTF8: (data: Buffer) => boolean = require('utf-8-validate');

export class IncomingDataManager extends EventDispatcher {

    private readonly queue = new Array<WebsocketDataFrame>();

    constructor(readonly connection: WebsocketClientConnection) {
        super();
        connection.addEventListener("data-frame", ({data}) => this.validateDataFrame(data), this);
        connection.addEventListener("state-change", this.stop, this).withGuards(
            ({connection: {state}}: StateChangeEvent) => state >= ConnectionState.Closing
        ).once();
    }

    addEventListener(event: "data", listener: EventListener<Event<WebsocketDataFrame>>, scope?: Object);
    addEventListener(event: string | Symbol, listener: EventListener<any>, scope?: Object) {
        return super.addEventListener(event, listener, scope);
    }

    private readonly stop = () => {
        this.connection.removeAllEventListeners(this);
    };

    private readonly validateDataFrame = (dataFrame: WebsocketDataFrame) => {
        const {connection, queue} = this;
        const {ProtocolError, InvalidFramePayloadData} = WebsocketCloseCode;
        const {ContinuationFrame, TextFrame} = WebsocketDataFrameType;

        const {type, isFinal, rsv1, rsv2, rsv3, payload} = dataFrame;

        const controlFrame = isControlFrame(type);

        if (!isFinal && controlFrame) {
            connection.close(ProtocolError, `Received fragmented message that should never be fragmented ${JSON.stringify(dataFrame)}`);
            return;
        }

        if ([rsv1, rsv2, rsv3].includes(true)) {
            connection.close(ProtocolError, `Some RSV fields have not being reset by extensions ${JSON.stringify(dataFrame)}`);
            return;
        }

        if (controlFrame) {
            // Rest of checks are applied to message frames
            return;
        }

        if (queue.length === 0 && type === ContinuationFrame) {
            connection.close(ProtocolError, `Received continuation frame with not preceding opening frame: ${JSON.stringify(dataFrame)}`);
            return;
        }

        if (queue.length > 0 && type !== ContinuationFrame) {
            connection.close(ProtocolError, `Received double opening frames: ${JSON.stringify(dataFrame)}`);
            return;
        }

        const frameType = queue.length > 0 ? queue[0].type : dataFrame.type;

        // TODO: cebae1bdb9cf83cebcceb5f4 is not reported as valid UTF8, while it should be - remove this hack
        // && dataFrame.payload.toString("hex") !== 'cebae1bdb9cf83cebcceb5f4'
        if (isFinal && frameType === TextFrame && isValidUTF8(payload) === false) {
            connection.close(InvalidFramePayloadData, `Received invalid UTF8 content 1: ${JSON.stringify({
                ...dataFrame,
                payload: dataFrame.payload.toString("hex")
            })}`);
            return;
        }

        if (isFinal && queue.length === 0) {
            this.dispatchEvent("data", dataFrame);
            return;
        }

        queue.push(dataFrame);
        if (!isFinal) {
            return;
        }

        const messageBuffer = Buffer.concat(queue.map(({payload}) => payload));
        if (frameType === TextFrame && !isValidUTF8(payload)) {
            connection.close(InvalidFramePayloadData, `Received invalid UTF8 content 2: ${JSON.stringify({
                dataFrame: {...dataFrame, payload: dataFrame.payload.toString("hex")},
                messageBuffer: messageBuffer.toString("hex")
            })}`);
            return;
        }

        if (isFinal) {
            this.dispatchEvent("data", {...queue[0], payload: messageBuffer});
        }
    }
}


const isControlFrame = (type: WebsocketDataFrameType) => ![
    WebsocketDataFrameType.TextFrame,
    WebsocketDataFrameType.BinaryFrame,
    WebsocketDataFrameType.ContinuationFrame
].includes(type);
