import {ConfigurationContext} from "..";
import {ResponsiveEvent} from "./ResponsiveEvent";

export class UpdateConfigurationContextEvent extends ResponsiveEvent<boolean> {

    static readonly TYPE = Symbol("update-configuration-context");

    constructor(readonly context: ConfigurationContext, readonly isForwarded = false) {
        super(UpdateConfigurationContextEvent.TYPE, context);
    }
}
