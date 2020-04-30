import {Command, Event, Inject} from "quiver-framework";
import {IpcMessenger} from "../../../ipcMessanger/service/IpcMessenger";
import {
    ConfigurationConfigIpcMessage,
    ConfigurationConfigIpcMessageType
} from "../../data/ipc/ConfigurationConfigIpcMessage";
import {DeleteConfigurationContextEvent} from "../../event/DeleteConfigurationContextEvent";
import {configurationContextIpcScope} from "../../data/ipc/configurationContextIpcScope";
import {UpdateConfigurationContextEvent} from "../../event/UpdateConfigurationContextEvent";

/**
 * Forward changes to configuration context within this node to parent process, which will then relay it to other
 * interested parties.
 */
export class ForwardConfigurationContextMessageToMaster implements Command {

    @Inject()
    private event: Event;
    @Inject()
    private messenger: IpcMessenger;

    async execute(): Promise<void> {
        const {event, messenger: {send}} = this;

        const scope = configurationContextIpcScope;
        let payload: ConfigurationConfigIpcMessage;

        if (event instanceof UpdateConfigurationContextEvent) {
            payload = {type: ConfigurationConfigIpcMessageType.Update, contextId: event.contextId};
        } else if (event instanceof DeleteConfigurationContextEvent) {
            payload = {type: ConfigurationConfigIpcMessageType.Delete, contextId: event.contextId};
        }

        send({scope, payload});
    }
}
