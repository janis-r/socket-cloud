import {WebsocketExtensionConfig} from "..";

/**
 * Parse sec-websocket-extensions header value
 * @param headerString
 */
export function parseWebsocketExtensionOffers(headerString: string): Map<string, Set<WebsocketExtensionConfig>> {
    const extensionMap = new Map<string, Set<WebsocketExtensionConfig>>();
    if (!headerString || !headerString.length) {
        return new Map();
    }

    headerString.split(/,\s*/g)
        .map(entry => entry.split(/;\s*/g))
        .forEach(([extensionName, ...params]) => {
            const values: WebsocketExtensionConfig['values'] = {};
            params.forEach(param => {
                const [paramName, value] = param.split('=');
                values[paramName] = value ? normalizeHeaderParamValue(value) : undefined;
            });

            const config: WebsocketExtensionConfig = {
                origin: [extensionName, ...params].join(';'),
                values
            };

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
