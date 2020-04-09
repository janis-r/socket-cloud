import {Command, EventDispatcher, Inject} from "quiver-framework";
import {IpcMessageEvent} from "../../../ipcMessanger";
import {
    ConfigurationConfigIpcMessageType,
    configurationConfigIpcMessageValidator
} from "../../data/ipc/ConfigurationConfigIpcMessage";
import {DeleteConfigurationContextEvent} from "../../event/DeleteConfigurationContextEvent";
import {UpdateConfigurationContextEvent} from "../../event/UpdateConfigurationContextEvent";

export class ForwardConfigurationContextMessageWithinWorker implements Command {

    @Inject()
    private event: IpcMessageEvent;
    @Inject()
    private eventDispatcher: EventDispatcher;

    async execute(): Promise<void> {
        const {event: {message: {payload}}, eventDispatcher} = this;
        if (!configurationConfigIpcMessageValidator.validate(payload)) {
            throw new Error(`Invalid incoming ConfigurationConfigIpcMessage encountered: ${JSON.stringify(payload)} `);
        }

        const {type, contextId} = payload;
        switch (type) {
            case ConfigurationConfigIpcMessageType.Update:
                eventDispatcher.dispatchEvent(new UpdateConfigurationContextEvent(contextId, true));
                break;
            case ConfigurationConfigIpcMessageType.Delete:
                eventDispatcher.dispatchEvent(new DeleteConfigurationContextEvent(contextId, true));
                break;
        }
    }
}
