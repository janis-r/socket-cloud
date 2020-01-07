import {Command, Inject} from "qft";
import {ClientConnectionPool, NewConnectionEvent} from "../../clientConnectionPool";
import {DataContextManagerProvider} from "../service/DataContextManagerProvider";
import {SyntheticEvent} from "../../utils/SyntheticEvent";

export class HandleNewConnection implements Command {

    @Inject()
    private event: SyntheticEvent<NewConnectionEvent>;
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
            dataContextManagerProvider: {getContextManager}
        } = this;

        const manager = await getContextManager(contextId);
        manager.handleNewConnection(connection);
    }

}
