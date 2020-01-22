import {Context, WebApplicationBundle} from "qft";
import {devServerModule} from "./devServerModule";

const {injector} = new Context().install(...WebApplicationBundle).configure(
    devServerModule
).initialize();

console.log(`Single core dev server context initialized`);
