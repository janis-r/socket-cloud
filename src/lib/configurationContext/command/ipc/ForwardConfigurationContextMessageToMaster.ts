import {Command, Event, Inject} from "quiver-framework";
import {IpcMessenger} from "../../../ipcMessanger";
import {DeleteConfigIpcMessage} from "../../data/ipc/DeleteConfigIpcMessage";
import {DeleteConfigurationContextEvent} from "../../event/DeleteConfigurationContextEvent";
import {configurationContextIpcScope} from "../../data/ipc/configurationContextIpcScope";
import {UpdateConfigurationContextEvent} from "../../event/UpdateConfigurationContextEvent";
import {UpdateConfigIpcMessage} from "../../data/ipc/UpdateConfigIpcMessage";

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
        if (event instanceof DeleteConfigurationContextEvent) {
            const {contextId} = event;
            const payload: DeleteConfigIpcMessage = {type: "delete", contextId};
            send({scope, payload});
        } else if (event instanceof UpdateConfigurationContextEvent) {
            const {context} = event;
            const payload: UpdateConfigIpcMessage = {type: "update", context};
            send({scope, payload});
        }
    }
}
