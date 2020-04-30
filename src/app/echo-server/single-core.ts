import {AppContext} from "quiver-framework";
import {Logger} from "../../lib/logger/service/Logger";
import {EchoServerModule} from "./EchoServerModule";

const {injector} = new AppContext().configure(EchoServerModule).initialize();
injector.get(Logger).console(`Single core echo server context initialized`);
