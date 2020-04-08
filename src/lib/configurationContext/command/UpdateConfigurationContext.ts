import {Command, Inject} from "quiver-framework";
import {ConfigurationContextManager} from "../service/ConfigurationContextManager";
import {UpdateConfigurationContextEvent} from "../event/UpdateConfigurationContextEvent";

export class UpdateConfigurationContext implements Command {

    @Inject()
    private readonly contextManager: ConfigurationContextManager;
    @Inject()
    private readonly event: UpdateConfigurationContextEvent;

    async execute(): Promise<void> {
        const {
            contextManager: {updateConfiguration},
            event: {context, isForwarded, setResponse}
        } = this;
        setResponse(await updateConfiguration(context, isForwarded));
    }

}
