import { valueBelongsToEnum } from "ugd10a";

export enum HttpMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
    PATCH = 'PATCH',
    HEAD = 'HEAD',
    TRACE = 'TRACE',
    OPTIONS = 'OPTIONS',
    CONNECT = 'CONNECT'
}

export const isHttpMethod = (value: unknown): value is HttpMethod => valueBelongsToEnum(HttpMethod, value);
