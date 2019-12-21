import {Command, Inject} from "qft";
import {ClientMessageEvent} from "../../../lib/clientConnectionPool";

export class EchoMessage implements Command {

    @Inject()
    private event: ClientMessageEvent;

    execute() {
        const {event: {connection, message}} = this;
        if (typeof message == "string") {
            connection.send(message);
        } else { // This is silly - and there should be a better way
            connection.send(message);
        }

    }

}
