import fetch from "node-fetch";
import {ConfigurationContext, configurationContextValidator, ContextId} from "../../../lib/configurationContext";
import {HttpStatusCode} from "../../../lib/httpServer";
import {createHeaders} from "./test-utils";

type ConfigurationContextWithOptionalProtocol =
    Partial<Pick<ConfigurationContext, "protocol">>
    & Omit<ConfigurationContext, "protocol">;

export class ConfigurationContextApi {
    readonly servicePath = "context-config";

    constructor(readonly serverUrl: string, readonly apiAccessKey: string) {
    }

    readonly configureConfigurationContext = async (configuration: ConfigurationContextWithOptionalProtocol): Promise<void> => {
        const {serverUrl, apiAccessKey, servicePath} = this;
        const request = await fetch(`${serverUrl}/${servicePath}/`, {
            method: "POST",
            headers: createHeaders(apiAccessKey, true),
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
        const {serverUrl, apiAccessKey, servicePath} = this;
        const request = await fetch(`${serverUrl}/${servicePath}/${contextId}`, {
            method: "GET",
            headers: createHeaders(apiAccessKey, false)
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
        const {serverUrl, apiAccessKey, servicePath} = this;
        const request = await fetch(`${serverUrl}/${servicePath}/${contextId}`, {
            method: "DELETE",
            headers: createHeaders(apiAccessKey, false)
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
