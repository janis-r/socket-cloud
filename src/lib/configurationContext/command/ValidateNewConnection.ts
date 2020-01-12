import {Command, Inject} from "qft";
import {Logger} from "../../logger";
import fetch from "node-fetch";
import {HttpStatusCode} from "../../types/HttpStatusCode";
import {Json} from "../../types/Json";
import {ValidateSocketConnectionEvent, ValidationError} from "../../websocketListener";
import {ConnectionValidationError} from "../data/ConnectionValidationError";

export class ValidateNewConnection implements Command<void> {
    @Inject()
    private readonly logger: Logger;

    @Inject()
    private readonly event: ValidateSocketConnectionEvent;

    async execute() {
        const {event: {addValidator}} = this;
        addValidator(this.validateConnectionCount);
        addValidator(this.validateWithExternalApi);
    }

    readonly validateConnectionCount = async (): Promise<true | ValidationError> => {
        const {context: {maxConnectionCount}} = this.event;

        if (!maxConnectionCount) {
            return true;
        }

        if (true /*TODO: Check connection count of this context here*/) {
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
            event: {
                descriptor,
                context: {connectionValidationUrl}
            }
        } = this;

        if (!connectionValidationUrl) {
            return true;
        }

        const request = await fetch(connectionValidationUrl, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(descriptor)
        });

        const {status} = request;
        if (status !== HttpStatusCode.Ok) {
            logger.error(`ConfigurationContextProvider wrong status while validating new connection`, JSON.stringify({
                request: {descriptor},
                response: {status, data: await request.text()}
            }, null, ' '));
            return {
                error: ConnectionValidationError.ApiConnectionError,
                message: 'Error while validating with external API'
            };
        }

        try {
            const data: Json = await request.json();
            if (data === true) {
                return true;
            }
            return {
                error: ConnectionValidationError.ConnectionNotAllowed,
                message: 'Connection not allowed by external API'
            };
        } catch {
            logger.error(`ConfigurationContextProvider invalid JSON in response while validating new connection`, JSON.stringify({
                request: {descriptor},
                response: {status}
            }, null, ' '));
            return {
                error: ConnectionValidationError.ApiDataFormatError,
                message: 'Json error while validating with external API'
            };
        }
    }
}
