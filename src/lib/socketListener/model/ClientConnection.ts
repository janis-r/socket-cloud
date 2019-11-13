import {Socket} from "net";
import {parseMessage} from "../util/web-socket-frame";

export class ClientConnection {

    constructor(private readonly socket: Socket) {
        socket.addListener("data", this.incomingDataHandler);
    }

    // If there is backpressure, write returns false and the you should wait for drain
    // to be emitted before writing additional data.

    private readonly incomingDataHandler = (data: Buffer): void => {

        const {header, getPayload} = parseMessage(data);
        console.log('>> header', header);
        console.log('>> payload', getPayload().toString('utf8'));

        process.exit()
    };

}
