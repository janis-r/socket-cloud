import {Socket} from "net";

export class RedundandClientConnection {

    readonly remoteAddress;

    constructor(private readonly socket: Socket) {
        this.remoteAddress = socket.remoteAddress;
    }

    readonly write = (message: string) => new Promise<true>((resolve, reject) => {
        this.socket.write(message, (err?: Error) => err ? reject(err) : resolve(true));
    });

}
