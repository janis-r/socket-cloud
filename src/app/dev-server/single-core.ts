import {AppContext} from "qft";
import {devServerModule} from "./devServerModule";

const {injector} = new AppContext().configure(devServerModule).initialize();

console.log(`Single core dev server context initialized`);
