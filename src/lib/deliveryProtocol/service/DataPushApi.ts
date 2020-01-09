import {Injectable} from "qft";
import {HttpServerRouter} from "../../httpServer";
import {HttpRequestHandler} from "../../httpServer/data/HttpRequestHandler";

@Injectable()
export class DataPushApi {

    constructor(router: HttpServerRouter) {
        router.post("individual/:connectionIds", this.individualMessageHandler);
        router.post("channel-message", this.channelMessageHandler);
        router.post("multi-channel-message", this.multiChannelMessageHandler);
    }

    private readonly individualMessageHandler: HttpRequestHandler = (request, response) => {

    };

    private readonly channelMessageHandler: HttpRequestHandler = (request, response) => {

    };

    private readonly multiChannelMessageHandler: HttpRequestHandler = (request, response) => {

    };
}
