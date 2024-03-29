import { Command, Inject } from "quiver-framework";
import { ConnectionRemovedEvent } from "../../clientConnectionPool/event/ConnectionRemovedEvent";
import { DataContextManagerProvider } from "../service/DataContextManagerProvider";

export class HandleRemovedConnection implements Command {

    @Inject()
    private event: ConnectionRemovedEvent;
    @Inject()
    private dataContextManagerProvider: DataContextManagerProvider;

    async execute(): Promise<void> {
        const {
            event: {
                connection,
                connection: { context: { id: contextId } }
            },
            dataContextManagerProvider: { getContextManager, resetContextManager }
        } = this;

        const manager = await getContextManager(contextId);
        manager.removeConnection(connection);

        if (!manager.connectionCount) {
            resetContextManager(contextId);
        }
    }

}
