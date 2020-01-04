import {Inject} from "qft";
import {ConfigurationContext} from "../../configurationContext";
import {ClientConnection} from "../../clientConnectionPool";

export class DataContextManager {

    @Inject()
    readonly context: ConfigurationContext;

    handleNewConnection(connection: ClientConnection): void {

    }

    async handleRemovedConnection(connection: ClientConnection): Promise<void> {

    }
}
