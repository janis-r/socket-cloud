/**
 * Parse sec-websocket-extensions header value into Map describing extensions and their params
 * @param headerString
 */
import {WebsocketExtensionConfig} from "..";

export function parseWebsocketExtensionOffers(headerString: string): Map<string, Set<WebsocketExtensionConfig>> {
    const extensionMap = new Map<string, Set<WebsocketExtensionConfig>>();
    if (!headerString || !headerString.length) {
        return new Map();
    }

    headerString.split(/,\s*/g).map(entry => entry.split(/;\s*/g))
        .forEach(([extensionName, ...params]) => {
            const config: WebsocketExtensionConfig = new Map(params.map((param): [string, string | number | undefined] => {
                const [paramName, value] = param.split('=');
                return [
                    paramName,
                    value ? normalizeHeaderParamValue(value) : undefined
                ];
            }));

            if (extensionMap.has(extensionName)) {
                extensionMap.get(extensionName).add(config);
            } else {
                extensionMap.set(extensionName, new Set<WebsocketExtensionConfig>([config]));
            }
        });
    return extensionMap;
}


function normalizeHeaderParamValue(value: string): string | number {
    value = value.replace(/^\s*('|")|('|")\s*$/gm, ''); // According to docs this value can be quoted
    if (value.match(/^\d+$/)) {
        return parseInt(value);
    }
    return value;
}
