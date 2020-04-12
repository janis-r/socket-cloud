import fetch from "node-fetch";
import {ContextId} from "../../../lib/configurationContext";
import {HttpStatusCode} from "../../../lib/httpServer";
import {AccessConfiguration} from "../../../lib/authorization/data/AccessConfiguration";
import {TokenData, tokenDataValidator} from "../../../lib/authorization/data/TokenData";
import {createHeaders} from "./test-utils";

export class AccessTokenApi {
    readonly servicePath = "access-token";

    constructor(readonly serverUrl: string,
                readonly contextId: ContextId,
                readonly apiAccessKey: string
    ) {
    }

    readonly createAccessEntry = async (configuration?: AccessConfiguration): Promise<TokenData["token"]> => {
        const {serverUrl, contextId, apiAccessKey, servicePath} = this;
        const request = await fetch(`${serverUrl}/${servicePath}/${contextId}`, {
            method: "POST",
            headers: createHeaders(apiAccessKey, true),
            body: configuration ? JSON.stringify(configuration) : null
        });

        const {status, statusText} = request;
        if (status === HttpStatusCode.Ok) {
            const {token} = await request.json();
            return token;
        }

        throw new Error(`AccessToken API createAccessEntry produced error: ${JSON.stringify({
            status,
            statusText,
            response: await request.text()
        })}`);
    };

    readonly getTokensByContext = async (contextId: ContextId = this.contextId) => {
        const {serverUrl, apiAccessKey, servicePath} = this;
        const request = await fetch(`${serverUrl}/${servicePath}/${contextId}`, {
            method: "GET",
            headers: createHeaders(apiAccessKey, false)
        });

        const {status, statusText} = request;
        if (status !== HttpStatusCode.Ok) {
            throw new Error(`AccessToken API getTokensByContext produced error: ${JSON.stringify({
                status,
                statusText,
                response: await request.text()
            })}`);
        }

        const data = await request.json();
        if (!Array.isArray(data)) {
            throw new Error(`Expecting an array`);
        }

        return data.map(entry => {
            if (!tokenDataValidator.validate(entry)) {
                throw new Error(`Some entry is not valid token data - ${JSON.stringify(entry)}, ${JSON.stringify(tokenDataValidator.lastError)}`);
            }
            return entry;
        });
    };

    readonly getTokensData = async (token: TokenData["token"], contextId: ContextId = this.contextId) => {
        const {serverUrl, apiAccessKey, servicePath} = this;
        const request = await fetch(`${serverUrl}/${servicePath}/${contextId}/${token}`, {
            method: "GET",
            headers: createHeaders(apiAccessKey, false)
        });

        const {status, statusText} = request;
        if (status !== HttpStatusCode.Ok) {
            throw new Error(`AccessToken API getTokensData produced error: ${JSON.stringify({
                status,
                statusText,
                response: await request.text()
            })}`);
        }

        const data = await request.json();
        if (!tokenDataValidator.validate(data)) {
            throw new Error(`Response is not valid token data - ${JSON.stringify(data)}, ${JSON.stringify(tokenDataValidator.lastError)}`);
        }

        return data;
    };
}
