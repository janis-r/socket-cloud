import {InjectionConfig, Injector, ModuleConfig} from "quiver-framework";
import {loggerModule} from "../logger";
import {PgConfig} from "./data/PgConfig";
import {PgConnection} from "./service/PgConnection";

export const PgConnectionModule: ModuleConfig = {
    requires: [
        loggerModule
    ],
    mappings: [
        {
            map: PgConnection,
            useFactory: (injector: Injector) => injector.injectInto(new PgConnection(injector.get(PgConfig)))
        } as InjectionConfig<PgConnection>,
        {
            map: PgConfig, useValue: {
                host: '127.0.0.1',
                database: 'pg',
                port: 5432,
                user: '******',
                password: '******'
            }
        } as InjectionConfig<PgConfig>
    ]
};
