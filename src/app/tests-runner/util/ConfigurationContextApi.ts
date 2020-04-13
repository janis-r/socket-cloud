import fetch from "node-fetch";
import {ConfigurationContext, configurationContextValidator, ContextId} from "../../../lib/configurationContext";
import {HttpStatusCode} from "../../../lib/httpServer";
import {createHeaders} from "./test-utils";

type ConfigurationContextWithOptionalProtocol =
    Partial<Pick<ConfigurationContext, "protocol">>
    & Omit<ConfigurationContext, "protocol">;

export class ConfigurationContextApi {

    constructor(readonly servicePath: string,
                readonly apiKey: string) {
    }

    readonly configureConfigurationContext = async (configuration: ConfigurationContextWithOptionalProtocol): Promise<void> => {
        const {servicePath, apiKey} = this;
        const request = await fetch(`${servicePath}/`, {
            method: "POST",
            headers: createHeaders(apiKey, true),
            body: JSON.stringify(configuration)
        });

        const {status, statusText} = request;
        if (status !== HttpStatusCode.Ok) {
            throw new Error(`ConfigurationContext API configureConfigurationContext produced error: ${JSON.stringify({
                status,
                statusText,
                response: await request.text()
            })}`);
        }
    };

    readonly getConfigurationContext = async (contextId: ContextId): Promise<ConfigurationContext> => {
        const {servicePath, apiKey} = this;
        const request = await fetch(`${servicePath}/${contextId}`, {
            method: "GET",
            headers: createHeaders(apiKey, false)
        });

        const {status, statusText} = request;
        if (status !== HttpStatusCode.Ok) {
            throw new Error(`ConfigurationContext API getConfigurationContext produced error: ${JSON.stringify({
                status,
                statusText,
                response: await request.text()
            })}`);
        }

        const data = await request.json();
        if (!configurationContextValidator.validate(data)) {
            throw new Error(`Expecting an instance of configuration context, e - ${JSON.stringify(configurationContextValidator.lastError)}`);
        }

        return data;
    };

    readonly deleteConfigurationContext = async (contextId: ContextId): Promise<void> => {
        const {servicePath, apiKey} = this;
        const request = await fetch(`${servicePath}/${contextId}`, {
            method: "DELETE",
            headers: createHeaders(apiKey, false)
        });

        const {status, statusText} = request;
        if (status !== HttpStatusCode.Ok) {
            throw new Error(`ConfigurationContext API deleteConfigurationContext produced error: ${JSON.stringify({
                status,
                statusText,
                response: await request.text()
            })}`);
        }
    };


}
