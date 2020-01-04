import {Command, Inject} from "qft";
import {ClientMessageEvent} from "../../clientConnectionPool";
import {DataContextManagerProvider} from "../service/DataContextManagerProvider";

export class HandleClientMessage implements Command {

    @Inject()
    private event: ClientMessageEvent;
    @Inject()
    private dataContextManagerProvider: DataContextManagerProvider;

    execute(): void {
        const {
            event: {message, connection: {id: connectionId}},
            dataContextManagerProvider: {getContextManager}
        } = this;


    }

}
