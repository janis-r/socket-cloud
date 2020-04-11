import {SqLiteConnection} from "../../../sqLite";
import {ConfigurationContextModel} from "../ConfigurationContextModel";
import {ContextId} from "../../data/ContextId";
import {ConfigurationContext, configurationContextValidator} from "../../data/ConfigurationContext";

export class ConfigurationContextModelSqLite implements ConfigurationContextModel {

    private readonly db: SqLiteConnection;

    constructor() {
        try {
            this.db = new SqLiteConnection("context-config");
            this.db.ready.then(() => this.initialize());
        } catch (e) {
            console.log(`Error while connecting to Sqlite: ${e.message}`);
        }
    }

    private async initialize() {
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS context_config
            (
                id            VARCHAR PRIMARY KEY UNIQUE,
                configuration TEXT     NOT NULL,
                created       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
    }

    readonly deleteConfiguration = async (contextId: ContextId): Promise<boolean> => {
        const {changes} = await this.db.run(`
                    DELETE
                    FROM context_config
                    WHERE id = ?
            `,
            [contextId]
        );
        return !!changes;
    };

    readonly getConfiguration = async (contextId: ContextId): Promise<ConfigurationContext | null> => {
        const row = await this.db.get<{ configuration: string }>(`
                    SELECT configuration
                    FROM context_config
                    WHERE id = ?
            `,
            [contextId]
        );
        if (!row) {
            return null;
        }

        let configuration: unknown;
        try {
            configuration = JSON.parse(row.configuration);
        } catch (e) {
            throw new Error(`Configuration context data is invalid JSON e - ${e.message}`);
        }

        if (!configurationContextValidator.validate(configuration)) {
            throw new Error(`Invalid context configuration extracted from DB - err: ${JSON.stringify(configurationContextValidator.lastError)}`);
        }

        return configuration;
    };

    readonly saveConfiguration = async (configuration: ConfigurationContext): Promise<boolean> => {
        if (!configurationContextValidator.validate(configuration)) {
            throw new Error(`Cannot save invalid configuration context - err: ${JSON.stringify(configurationContextValidator.lastError)}`);
        }

        const {changes} = await this.db.run(`
                    INSERT OR
                    REPLACE
                    INTO context_config(id, configuration)
                    VALUES (?, ?);
            `,
            [configuration.id, JSON.stringify(configuration)]
        );
        return !!changes;
    };
}

