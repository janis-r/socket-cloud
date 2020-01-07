import {Command, Event, EventDispatcher, Inject} from "qft";
import {SyntheticEvent, syntheticEventType} from "../../utils/SyntheticEvent";
import {ClientConnection} from "..";

export class DispatchSyntheticEvent implements Command {

    @Inject()
    private event: Event<ClientConnection>;

    @Inject()
    private eventDispatcher: EventDispatcher;

    execute(): Promise<void> | void {
        const {
            event,
            event: {type, data: {context: {protocol}}},
            eventDispatcher
        } = this;

        eventDispatcher.dispatchEvent(new SyntheticEvent(
            syntheticEventType({type, protocol}),
            event
        ));
    }

}
