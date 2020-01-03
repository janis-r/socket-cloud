import {Command, EventDispatcher, Inject} from "qft";
import {HttpConnectionUpgradeEvent} from "../../httpServer";
import {WebsocketConnectionValidationRequest} from "../event/WebsocketConnectionValidationRequest";
import {Logger} from "../../logger";

export class HandleConnectionUpgradeRequest implements Command {

    @Inject()
    private event: HttpConnectionUpgradeEvent;
    @Inject()
    private eventDispatcher: EventDispatcher;
    @Inject()
    private logger: Logger;

    execute(): Promise<void> | void {
        const {
            event: {
                request,
                request: {url, method, headers, connection: {remoteAddress}},
                socket
            },
            eventDispatcher,
            logger: {console}
        } = this;



        const requestInfo = {remoteAddress, url, method, headers};
        console('>> requestInfo:', requestInfo);

        eventDispatcher.dispatchEvent(new WebsocketConnectionValidationRequest(
            request,
            socket,
            JSON.stringify(requestInfo, null, ' ')
        ));
    }

}
