import {AppContext} from "quiver-framework";
import {devServerModule} from "./devServerModule";
import * as path from "path";
import url from "url";

// console.log(url.parse("http://domain.com/path?foo=1", true))
// console.log(url.parse("http://domain.com/path/?foo=1", true))
// process.exit()
const {injector} = new AppContext().configure(devServerModule).initialize();

console.log(`Single core dev server context initialized`);
