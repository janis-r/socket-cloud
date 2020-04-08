import {ContextId} from "..";
import {ResponsiveEvent} from "./ResponsiveEvent";

export class DeleteConfigurationContextEvent extends ResponsiveEvent<boolean> {

    static readonly TYPE = Symbol("delete-configuration-context");

    constructor(readonly contextId: ContextId, readonly isForwarded = false) {
        super(DeleteConfigurationContextEvent.TYPE, contextId);
    }

}
