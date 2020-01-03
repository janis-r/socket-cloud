import {Command, Inject} from "qft";
import {HttpRequestEvent, HttpServerRouter} from "..";
import {isHttpMethod} from "../../types/HttpMethod";

export class RouteHttpRequest implements Command {

    @Inject()
    private event: HttpRequestEvent;

    @Inject()
    private router: HttpServerRouter;

    execute(): Promise<void> | void {
        const {
            event: {
                request, request: {
                    method,
                    url
                },
                response
            },
            router
        } = this;

        if (isHttpMethod(method)) {
            router.getHandler(method, url)?.(request, response);
        }

    }

}
