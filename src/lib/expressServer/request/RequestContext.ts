import {removeObjectNullValues, Timer, uniqueValues} from "ugd10a";
import {NextFunction, Request, Response} from "express";
import {Logger} from "../../logger";

export class RequestContext {

    readonly id = Math.floor(Math.random() * 0xFFFFFF).toString(16);
    readonly isRequestTarget: boolean;

    private readonly timer = new Timer();

    private _ipAddress: string;

    constructor(private readonly request: Request,
                private readonly response: Response,
                public readonly next: NextFunction,
                private readonly logger: Logger) {

        if (request.session && 'referer' in request.session) {
            request.session.referer = request.header('Referer');
            request.session.startTime = new Date();
        }

        this.dumpRequestInfo();
    }

    get sessionId() {
        return this.request.sessionID;
    }

    get session() {
        return this.request.session;
    }

    get body() {
        return this.request.body;
    }

    get ipAddress(): string {
        if (!this._ipAddress) {
            const forwardedIpsStr = this.request.header('x-forwarded-for');
            if (forwardedIpsStr) {
                this._ipAddress = forwardedIpsStr.split(',')[0];
            }
            if (!this._ipAddress) {
                this._ipAddress = this.request.connection.remoteAddress!;
            }
        }
        return this._ipAddress;
    }

    get referer() {
        return this.request.header('Referer');
    }

    /**
     * Get URL "get" variable value
     * @param key
     */
    readonly query = (key: string): ParamParser => new ParamParser(this.request.query[key]);

    /**
     * Get URL part param value
     * @param key
     */
    readonly param = (key: string): ParamParser => new ParamParser(this.request.params[key]);

    /**
     * Get request header
     * @param name
     */
    readonly header = (name: string): string | undefined => this.request.header(name);

    /**
     * Send response to request
     * @param data Anything that should be going back to client
     * @param parameters
     */
    readonly respond = (data: any, parameters: { format?: "json" | "html", ttl?: number, status?: number, headers?: { [header: string]: string } } = {}): void => {
        const {format = "json", ttl = 0, status = null, headers = null} = parameters;

        const timeElapsed = this.timer.elapsed;
        const {response, request} = this;

        if (ttl) {
            response.header("Cache-Control", "max-age=" + ttl);
        }
        if (headers) {
            Object.keys(headers).forEach(name => response.header(name, headers[name]))
        }
        if (status) {
            response.status(status);
        }
        if (format === "json") {
            response.json(removeObjectNullValues(data));
        } else if (format === "html") {
            response.send(removeObjectNullValues(data));
        }
        if (!this.isRequestTarget) {
            this.dumpRequestInfo();
        }
        this.logger.debug(`[${this.id}] [${request.url}] Returned in ${timeElapsed} ms`);
    };

    toString(): string {
        const {id, request: {url, params, query}} = this;
        return `RequestContext(id: ${id}, url: ${url}, params: [${Object.keys(params).join(',')}], query: [${Object.keys(query).join(',')}])`;
    }

    private dumpRequestInfo(): void {
        const {request, logger: {debug}, isRequestTarget} = this;
        debug("\n");
        debug(`>> [${this.id}] ${request.originalUrl}`);
        if (!isRequestTarget) {
            debug(`  direct url: `, request.url);
        }
        debug(`  ip: `, this.ipAddress);
        debug(`  referer: `, request.header('Referer'));
        debug(`  method: `, request.method);
        debug(`  sessionId:`, request.sessionID);
        debug(`  body:   `, JSON.stringify(request.body, null, '   '));
    }
}

class ParamParser {

    constructor(private readonly value: string) {
    }

    isSet = () => this.value !== undefined;

    asInt<T = any>(fallbackValue?: T, allowNegativeValues: boolean = false): number | T {
        let value: number = NaN;
        if (this.value) {
            value = parseInt(this.value);
        }
        if (!isNaN(value) && (value >= 0 || allowNegativeValues)) {
            return value;
        }
        return fallbackValue !== undefined ? fallbackValue : NaN;
    }

    asFloat<T = any>(fallbackValue?: T, allowNegativeValues: boolean = false): number | T {
        let value: number = NaN;
        if (this.value) {
            value = parseFloat(this.value);
        }
        if (!isNaN(value) && (value >= 0 || allowNegativeValues)) {
            return value;
        }
        return fallbackValue !== undefined ? fallbackValue : NaN;
    }

    asIntList(): number[] {
        if (!this.value) {
            return [];
        }
        const entries = this.value.split(',').map(entry => parseInt(entry)).filter(entry => !isNaN(entry));
        if (!entries || !entries.length) {
            return [];
        }
        return uniqueValues(entries);
    }

    asFloatList(): number[] {
        if (!this.value) {
            return [];
        }
        const entries = this.value.split(',').map(entry => parseFloat(entry)).filter(entry => !isNaN(entry));
        if (!entries || !entries.length) {
            return [];
        }
        return uniqueValues(entries);
    }

    asString(): string {
        return this.value ? this.value.trim() : "";
    }

    asBool(): boolean {
        return this.value === "true";
    }
}

function trimUrl(url: string): string {
    return url ? url.replace(/^\/|\/$/, '') : '';
}
