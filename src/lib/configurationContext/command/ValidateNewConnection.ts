import {Command, Inject} from "quiver-framework";
import {Logger} from "../../logger";
import fetch from "node-fetch";
import {HttpStatusCode} from "../../httpServer/data/HttpStatusCode";
import {Json} from "../../types/Json";
import {ValidateSocketConnectionEvent, ValidationError} from "../../websocketListener";
import {ConnectionValidationError} from "../data/ConnectionValidationError";
import {isOperatorData} from "../../websocketListener/data/OperatorData";
import {ClientConnectionPool} from "../../clientConnectionPool";

export class ValidateNewConnection implements Command<void> {
    @Inject()
    private readonly logger: Logger;
    @Inject()
    private readonly event: ValidateSocketConnectionEvent;
    @Inject()
    private readonly connectionPool: ClientConnectionPool;

    async execute() {
        const {event: {addValidator}} = this;
        addValidator(this.validateConnectionCount);
        addValidator(this.validateWithExternalApi);
    }

    readonly validateConnectionCount = async (): Promise<true | ValidationError> => {
        const {
            event: {context: {id: contextId, maxConnectionCount}},
            connectionPool: {getConnectionsByContext}
        } = this;

        if (!maxConnectionCount || getConnectionsByContext(contextId).size < maxConnectionCount) {
            return true;
        }

        return {
            error: ConnectionValidationError.MaxConnectionCountReached,
            message: `Maximum connection count of ${maxConnectionCount} is reached`
        };
    };

    readonly validateWithExternalApi = async (): Promise<true | ValidationError> => {
        const {
            logger,
            event, event: {
                descriptor,
                context: {validationApi}
            }
        } = this;

        if (!validationApi.validateNewConnections) {
            return true;
        }

        const request = await fetch(validationApi.url + '/validate-connection', {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(descriptor)
        });

        const {status} = request;
        if (status !== HttpStatusCode.Ok) {
            logger.error(`ConfigurationContextProvider wrong status:${status} while validating new connection`, JSON.stringify({
                request: {descriptor},
                response: {status, data: await request.text()}
            }, null, ' '));
            return {
                error: ConnectionValidationError.ApiConnectionError,
                message: 'Error while validating with external API'
            };
        }

        const response: Json = await request.json();
        if (isOperatorData(response)) {
            event.operatorData = response;
        }

        return true;
    }
}
