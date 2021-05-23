import { AppContext } from "quiver-framework";
import { devServerModule } from "./devServerModule";
import { connectionApiModule } from "../../lib/platformApi/connectionApi/connectionApiModule";

const { injector } = new AppContext().configure(
    devServerModule,
    connectionApiModule
).initialize();

console.log(`Single core dev server context initialized`);
