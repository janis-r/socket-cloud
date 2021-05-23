import { RequestContext } from "./RequestContext";

export type HttpRequestHandler = (context: RequestContext) => void | Promise<void>;
