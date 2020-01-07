import {Command, Inject} from "qft";
import {ClientConnectionPool, ConnectionRemovedEvent} from "../../clientConnectionPool";
import {DataContextManagerProvider} from "../service/DataContextManagerProvider";
import {SyntheticEvent} from "../../utils/SyntheticEvent";

export class HandleRemovedConnection implements Command {

    @Inject()
    private event: SyntheticEvent<ConnectionRemovedEvent>;
    @Inject()
    private dataContextManagerProvider: DataContextManagerProvider;
    @Inject()
    private clientConnectionPool: ClientConnectionPool;

    async execute(): Promise<void> {
        const {
            event: {
                source: {
                    connection,
                    connection: {context: {id: contextId}}
                }
            },
            dataContextManagerProvider: {getContextManager, resetContextManager},
            clientConnectionPool: {getConnectionsByContext}
        } = this;

        const manager = await getContextManager(contextId);
        await manager.handleRemovedConnection(connection);
        if (getConnectionsByContext(contextId).size === 0) {
            resetContextManager(contextId);
        }
    }

}
