import {Event, EventDispatcher, EventListener} from "qft";
import {DataFrame} from "../../data/DataFrame";
import {WebsocketClientConnection} from "../WebsocketClientConnection";
import {DataFrameType} from "../../data/DataFrameType";
import {ConnectionState} from "../../../clientConnectionPool";
import {CloseCode} from "../../data/CloseCode";
import {StateChangeEvent} from "../../../clientConnectionPool/connectionEvent";

export class IncomingDataManager extends EventDispatcher {

    private readonly queue = new Array<DataFrame>();

    constructor(readonly connection: WebsocketClientConnection) {
        super();
        connection.addEventListener("data-frame", ({data}) => this.validateDataFrame(data), this);
        connection.addEventListener("state-change", this.stop, this).withGuards(
            ({connection: {state}}: StateChangeEvent) => state >= ConnectionState.Closing
        ).once();
    }

    addEventListener(event: "data", listener: EventListener<Event<DataFrame>>, scope?: Object) {
        return super.addEventListener(event, listener, scope);
    }

    private readonly stop = () => {
        this.connection.removeAllEventListeners(this);
    };

    private readonly validateDataFrame = (dataFrame: DataFrame) => {
        const {connection, queue} = this;
        const {ProtocolError} = CloseCode;
        const {ContinuationFrame} = DataFrameType;

        const {type, isFinal, rsv1, rsv2, rsv3} = dataFrame;

        const controlFrame = isControlFrame(type);
        if (!isFinal && controlFrame) {
            connection.close(ProtocolError, `Received fragmented message that should never be fragmented ${JSON.stringify(dataFrame)}`);
            return;
        }

        if ([rsv1, rsv2, rsv3].includes(true) && controlFrame) {
            connection.close(ProtocolError, `Enabled RSV fields on control frames seem to be an error: ${JSON.stringify(dataFrame)}`);
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

        if (isFinal && queue.length === 0) {
            this.dispatchEvent("data", dataFrame);
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
        this.dispatchEvent("data", aggregatedFrameData);
    }
}


const isControlFrame = (type: DataFrameType) => ![
    DataFrameType.TextFrame,
    DataFrameType.BinaryFrame,
    DataFrameType.ContinuationFrame
].includes(type);
