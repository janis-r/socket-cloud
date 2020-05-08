import {Router} from "../data/Router";

export const isSingleRouter = (value: any[]): value is [Router] => value.length === 1 && value[0] instanceof Router;
