import {createServer, Server, Socket} from "net";
import * as cluster from "cluster";
import {RedundandClientConnection} from "./RedundandClientConnection";

export class SocketServer {

    private readonly server: Server;
    private readonly connections: Array<RedundandClientConnection> = [];

    constructor() {
        this.server = createServer(this.newConnectionHandler);
    }

    private readonly newConnectionHandler = (socket: Socket) => {
        const connection = new RedundandClientConnection(socket);
        this.connections.push(connection);

        // 'connection' listener.
        console.log('client connected');
        socket.on('end', () => console.log('client disconnected'));
        socket.write(`hello${JSON.stringify({})}\r\n`);

        cluster.worker.send('New client')
    };

}
