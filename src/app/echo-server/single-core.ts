import {Context, WebApplicationBundle} from "qft";
import {Logger} from "../../lib/logger";
import {EchoServerModule} from "./EchoServerModule";

const {injector} = new Context().install(...WebApplicationBundle).configure(EchoServerModule).initialize();
injector.get(Logger).console(`Single core echo server context initialized`);
