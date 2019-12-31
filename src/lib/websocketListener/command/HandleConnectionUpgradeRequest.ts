import {Command, EventDispatcher, Inject} from "qft";
import {HttpConnectionUpgradeEvent} from "../../httpServer";
import {WebsocketConnectionValidationRequest} from "../event/WebsocketConnectionValidationRequest";

export class HandleConnectionUpgradeRequest implements Command {

    @Inject()
    private event: HttpConnectionUpgradeEvent;
    @Inject()
    private eventDispatcher: EventDispatcher;

    execute(): Promise<void> | void {
        const {
            event: {
                request,
                request: {url, method, headers, connection: {remoteAddress}},
                socket
            }, eventDispatcher
        } = this;


        const requestInfo = {remoteAddress, url, method, headers};
        console.log('>>', {requestInfo});
        eventDispatcher.dispatchEvent(new WebsocketConnectionValidationRequest(
            request,
            socket,
            JSON.stringify(requestInfo, null, ' ')
        ));
    }

}
