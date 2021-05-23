import { Event } from "quiver-framework";
import { ContextId } from "../data/ContextId";

export class DeleteConfigurationContextEvent extends Event<string> {

    static readonly TYPE = Symbol("delete-configuration-context");

    constructor(readonly contextId: ContextId, readonly isForwarded = false) {
        super(DeleteConfigurationContextEvent.TYPE, contextId);
    }

}
