import {Command, EventDispatcher, Inject} from "quiver-framework";
import {IpcMessageEvent} from "../../../ipcMessanger";
import {deleteConfigIpcMessageValidator} from "../../data/ipc/DeleteConfigIpcMessage";
import {DeleteConfigurationContextEvent} from "../../event/DeleteConfigurationContextEvent";
import {UpdateConfigurationContextEvent} from "../../event/UpdateConfigurationContextEvent";
import {updateConfigIpcMessageValidator} from "../../data/ipc/UpdateConfigIpcMessage";

export class ForwardConfigurationContextMessageWithinWorker implements Command {

    @Inject()
    private event: IpcMessageEvent;
    @Inject()
    private eventDispatcher: EventDispatcher;

    async execute(): Promise<void> {
        const {event: {message: {payload}}, eventDispatcher} = this;
        if (deleteConfigIpcMessageValidator.validate(payload)) {
            const {contextId} = payload;
            eventDispatcher.dispatchEvent(new DeleteConfigurationContextEvent(contextId, true));
        } else if (updateConfigIpcMessageValidator.validate(payload)) {
            const {context} = payload;
            eventDispatcher.dispatchEvent(new UpdateConfigurationContextEvent(context, true));
        }
    }
}
