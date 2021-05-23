import { Command, Inject } from "quiver-framework";
import { ClientMessageEvent } from "../../lib/clientConnectionPool/event/ClientMessageEvent";

export class EchoMessageCommand implements Command {

    @Inject()
    private event: ClientMessageEvent;

    execute() {
        const { event: { connection, message } } = this;
        if (typeof message === "string") {
            connection.send(message);
        } else { // This is silly - and there should be a better way
            connection.send(message);
        }

    }

}
