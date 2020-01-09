import {Request, Response} from "express";

export type HttpRequestHandler = (request: Request, response: Response) => void | Promise<void>;
