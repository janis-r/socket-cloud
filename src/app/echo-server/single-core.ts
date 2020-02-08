import {AppContext} from "qft";
import {Logger} from "../../lib/logger";
import {EchoServerModule} from "./EchoServerModule";

const {injector} = new AppContext().configure(EchoServerModule).initialize();
injector.get(Logger).console(`Single core echo server context initialized`);
