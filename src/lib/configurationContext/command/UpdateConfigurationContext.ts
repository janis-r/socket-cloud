import {Command, Inject} from "quiver-framework";
import {UpdateConfigurationContextEvent} from "../event/UpdateConfigurationContextEvent";
import {ConfigurationContextProvider} from "../service/ConfigurationContextProvider";

export class UpdateConfigurationContext implements Command {

    @Inject()
    private readonly contextProvider: ConfigurationContextProvider;
    @Inject()
    private readonly event: UpdateConfigurationContextEvent;

    async execute(): Promise<void> {
        const {event: {contextId}, contextProvider: {resetConfiguration}} = this;
        resetConfiguration(contextId);
    }

}
