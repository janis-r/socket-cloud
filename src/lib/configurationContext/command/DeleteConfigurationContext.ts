import {Command, Inject} from "quiver-framework";
import {ConfigurationContextManager} from "../service/ConfigurationContextManager";
import {DeleteConfigurationContextEvent} from "../event/DeleteConfigurationContextEvent";

export class DeleteConfigurationContext implements Command {

    @Inject()
    private readonly contextManager: ConfigurationContextManager;
    @Inject()
    private readonly event: DeleteConfigurationContextEvent;

    async execute(): Promise<void> {
        const {contextManager: {deleteConfiguration}, event: {contextId, isForwarded, setResponse}} = this;
        setResponse(await deleteConfiguration(contextId, isForwarded));
    }

}
