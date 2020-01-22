import {MessageType, pushToServerUtil, subscribeMessageUtil} from "../../lib/deliveryProtocol/data";
import {SocketClient} from "./util/connection-utils";

const url = "http://localhost:8001";

const connections: SocketClient[] = [];
const connectionInitPromises = new Array(10).fill(0).map(async () => {
    const promise = new SocketClient(url).initialized;
    promise.then(value => {
        connections.push(value);
        value.connection.onMessage(message => console.log({connectionId: value.connectionId, message}));
    });
    return promise;
});

Promise.all(connectionInitPromises).then(async () => {

    const subscribeMsg = subscribeMessageUtil.serialize({type: MessageType.Subscribe, channels: ["/"]});
    for (const conn of connections) {
        await conn.connection.send(subscribeMsg);
        console.log('> subscribe', conn.connectionId)
    }

    const pushMsg = pushToServerUtil.serialize({
        type: MessageType.PushToServer,
        channels: ["/"],
        payload: "Hello!"
    });
    console.log({pushMsg});
    connections[0].connection.send(pushMsg);
});


setTimeout(() => {


}, 1000);
