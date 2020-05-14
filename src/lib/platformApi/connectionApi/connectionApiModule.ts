import {ModuleConfig} from "quiver-framework";
import {ConnectionApiListener} from "./service/ConnectionApiListener";
import {apiHubModule} from "../apiHub/apiHubModule";
import {ConnectionDataUtil} from "./service/ConnectionDataUtil";
import {clientConnectionPoolModule} from "../../clientConnectionPool/clientConnectionPoolModule";

export const connectionApiModule: ModuleConfig = {
    requires: [
        apiHubModule,
        clientConnectionPoolModule
    ],
    mappings: [
        {map: ConnectionApiListener, instantiate: true},
        ConnectionDataUtil
    ]
}
