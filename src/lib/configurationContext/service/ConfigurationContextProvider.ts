import {Inject} from "qft";
import {Logger} from "../../logger";
import {ConfigurationContext} from "../data/ConfigurationContext";
import fetch from "node-fetch";
import {SocketType} from "../../types/SocketType";
import {Json} from "../../types/Json";

export class ConfigurationContextProvider {

    @Inject()
    private readonly logger: Logger;

    readonly getConfigurationForWebSocket = async (remoteAddress: string, origin: string): Promise<ConfigurationContext | null> => {
        if (!origin) {
            return null;
        }

        const config: ConfigurationContext = {
            id: 'test',
            maxConnectionCount: 100,
            connectionValidationUrl: 'http://localhost:8000/validate-socket'
        };

        if (config.connectionValidationUrl) {
            if (await this.validateNewConnection(config.connectionValidationUrl, "web-socket", remoteAddress, origin) === false) {
                return null;
            }
        }

        return config;
    };

    private async validateNewConnection(url: string, type: SocketType, remoteAddress: string, origin: string | string[]): Promise<boolean> {
        const {logger} = this;
        const request = await fetch(url, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({type, remoteAddress, origin})
        });

        const {status} = request;
        if (status !== 200) {
            logger.error(`ConfigurationContextProvider wrong status while validating new connection`, JSON.stringify({
                request: {url, type, remoteAddress, origin},
                response: {status, data: await request.text()}
            }, null, ' '));
            return false;
        }

        try {
            const data: Json = await request.json();
            return data === true;
        } catch {
            logger.error(`ConfigurationContextProvider invalid JSON in response while validating new connection`, JSON.stringify({
                request: {url, type, remoteAddress, origin},
                response: {status}
            }, null, ' '));
            return false;
        }
    };
}

