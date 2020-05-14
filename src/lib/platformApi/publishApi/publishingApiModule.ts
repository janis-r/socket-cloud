import {ModuleConfig} from "quiver-framework";
import {PublishingApiListener} from "./service/PublishingApiListener";
import {apiHubModule} from "../apiHub/apiHubModule";


export const publishingApiModule: ModuleConfig = {
    requires: [
        apiHubModule
    ],
    mappings: [
        {map: PublishingApiListener, instantiate: true},
    ]
}
