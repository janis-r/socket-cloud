import {Command, Inject} from "quiver-framework";
import {DeleteConfigurationContextEvent} from "../event/DeleteConfigurationContextEvent";
import {ConfigurationContextProvider} from "../service/ConfigurationContextProvider";

export class DeleteConfigurationContext implements Command {

    @Inject()
    private readonly contextProvider: ConfigurationContextProvider;
    @Inject()
    private readonly event: DeleteConfigurationContextEvent;

    async execute(): Promise<void> {
        const {
            contextProvider: {resetConfiguration},
            event: {contextId}
        } = this;
        resetConfiguration(contextId);
    }

}
