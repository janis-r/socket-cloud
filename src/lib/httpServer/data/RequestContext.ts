import { NextFunction, Request, Response } from "express";
import { Json } from "../../types/Json";
import { StringParser } from "../util/StringParser";

/**
 * @template L Data type of local data passed along the middleware
 */
export class RequestContext<L = any> {

    readonly id = Math.floor(Math.random() * 0xFFFFFF).toString(16);
    private _fulfilled = false;
    private _ipAddress: string;

    constructor(
        readonly request: Request,
        readonly response: Response,
        readonly next: NextFunction) {

    }

    /**
     * Defines if request has been fulfilled as in - response is delivered
     */
    get fulfilled(): boolean {
        return this._fulfilled;
    }

    get ipAddress(): string {
        if (!this._ipAddress) {
            const forwardedIpsStr = this.request.header("x-forwarded-for");
            if (forwardedIpsStr) {
                this._ipAddress = forwardedIpsStr.split(',')[0];
            }
            if (!this._ipAddress) {
                this._ipAddress = this.request.connection.remoteAddress!;
            }
        }
        return this._ipAddress;
    }

    get body(): Json {
        return this.request.body;
    }

    get referer() {
        return this.request.header("Referer");
    }

    get path() {
        return this.request.path;
    }

    get headers(): Readonly<Request["headers"]> {
        return this.request.headers;
    }

    get locals(): L {
        return this.request.app.locals;
    }

    /**
     * Get URL "get" variable value
     * @param key
     */
    readonly query = (key: string) => new StringParser(this.request.query[key]);

    /**
     * Get URL part param value
     * @param key
     */
    readonly param = (key: string) => new StringParser(this.request.params[key]);

    /**
     * Get request header
     * @param name
     */
    readonly header = (name: string) => this.request.header(name);

    /**
     * Set request custom data
     */
    readonly setLocals = (value: L) => this.request.app.locals = value;

    /**
     * Respond with html status
     * @param code
     */
    readonly sendStatus = (code: number) => this.response.sendStatus(code);

    /**
     * Respond with HTML content
     * @param data
     * @param params
     */
    readonly sendHtml = (data: string, params?: ResponseParams) => this.sendResponse("html", data, params);

    /**
     * Respond with Json content
     * @param data
     * @param params
     */
    readonly sendJson = (data: any, params?: ResponseParams) => this.sendResponse("json", data, params);

    /**
     * Respond with text content
     * @param data
     * @param params
     */
    readonly sendText = (data: string, params?: ResponseParams) => this.sendResponse("text", data, params);

    /**
     * Send file content
     * @param path
     * @param params
     */
    readonly sendFile = (path: string, params?: ResponseParams) => this.sendResponse("file", path, params);

    private sendResponse(type: "json", data: Json, params: ResponseParams): void;
    private sendResponse(type: "html" | "text" | "file", data: string, params: ResponseParams): void;
    private sendResponse(type: "html" | "text" | "file" | "json", data: string | Json, params: ResponseParams): void {
        if (this._fulfilled) {
            throw new Error('Request is already fulfilled');
        }

        const { response } = this;
        if (params) {
            const { ttl, status, header } = params;
            if (ttl) {
                response.header("Cache-Control", `max-age=${ttl}`);
            }
            if (status) {
                response.status(status);
            }
            if (header) {
                for (const name in header) {
                    response.header(name, header[name]);
                }
            }
        }
        switch (type) {
            case "text":
                response.set("Content-Type", "text/plain");
            case "html":
                response.send(data);
                break;
            case "json":
                response.json(data);
                break;
            case "file":
                response.sendFile(data as string);
                break;
        }
        this._fulfilled = true;
    }
}

type ResponseParams = { ttl?: number, status?: number, header?: Record<string, string> };
