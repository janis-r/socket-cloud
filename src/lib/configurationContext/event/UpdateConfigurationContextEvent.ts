import {Event} from "quiver-framework";
import {ContextId} from "..";

export class UpdateConfigurationContextEvent extends Event<string> {

    static readonly TYPE = Symbol("update-configuration-context");

    constructor(readonly contextId: ContextId, readonly isForwarded = false) {
        super(UpdateConfigurationContextEvent.TYPE, contextId);
    }
}
