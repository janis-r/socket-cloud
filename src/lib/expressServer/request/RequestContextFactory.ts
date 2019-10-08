import {Inject} from "qft";
import {NextFunction, Request, Response} from "express";
import {RequestContext} from "./RequestContext";
import {Logger} from "../../logger";

export class RequestContextFactory {
    @Inject() private logger: Logger;

    readonly spawn = (req: Request, res: Response, next: NextFunction) => new RequestContext(req, res, next, this.logger);
}
