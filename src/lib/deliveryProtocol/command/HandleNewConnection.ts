import {Command, Inject} from "qft";
import {ClientConnectionPool, NewConnectionEvent} from "../../clientConnectionPool";
import {DataContextManagerProvider} from "../service/DataContextManagerProvider";

export class HandleNewConnection implements Command {

    @Inject()
    private event: NewConnectionEvent;
    @Inject()
    private dataContextManagerProvider: DataContextManagerProvider;
    @Inject()
    private clientConnectionPool: ClientConnectionPool;

    async execute(): Promise<void> {

        const {
            event: {
                connection,
                connection: {context: {id: contextId}}
            },
            dataContextManagerProvider: {getContextManager}
        } = this;

        const manager = await getContextManager(contextId);
        manager.handleNewConnection(connection);
    }

}
