import {SqLiteConnection} from "../../../sqLite";
import {AccessTokenDataModel} from "../AccessTokenDataModel";
import {TokenData, tokenDataValidator} from "../../data/TokenData";
import {ContextId} from "../../../configurationContext/data/ContextId";
import {AccessConfiguration, accessConfigurationValidator} from "../../data/AccessConfiguration";

export class AccessTokenDataModelSqLite implements AccessTokenDataModel {

    private readonly db: SqLiteConnection;

    constructor() {
        try {
            this.db = new SqLiteConnection("db/access-token.db");
            this.db.ready.then(() => this.initialize());
        } catch (e) {
            console.log(`Error while connecting to Sqlite: ${e.message}`);
        }
    }

    private async initialize() {
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS access_token
            (
                token         VARCHAR PRIMARY KEY UNIQUE,
                context_id    VARCHAR  NOT NULL,
                configuration TEXT     NOT NULL,
                created       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
    }

    readonly getTokenData = async (token: TokenData["token"]): Promise<TokenData | null> => {
        const row = await this.db.get<{ configuration: string }>(`
                    SELECT configuration
                    FROM access_token
                    WHERE token = ?
            `,
            [token]
        );
        if (!row) {
            return null;
        }

        let tokenData: unknown;
        try {
            tokenData = JSON.parse(row.configuration);
        } catch (e) {
            throw new Error(`Token data is invalid JSON e - ${e.message}`);
        }

        if (!tokenDataValidator.validate(tokenData)) {
            throw new Error(`Invalid token data extracted from DB - err: ${JSON.stringify(tokenDataValidator.lastError)}`);
        }

        return tokenData;
    };

    readonly getTokensByContext = async (contextId: ContextId): Promise<Array<TokenData>> => {
        const rows = await this.db.all<{ configuration: string }>(`
                    SELECT configuration
                    FROM access_token
                    WHERE context_id = ?
            `,
            [contextId]
        );
        if (!rows || !rows.length) {
            return [];
        }

        return rows.map(({configuration}) => {
            let tokenData: unknown;
            try {
                tokenData = JSON.parse(configuration);
            } catch (e) {
                throw new Error(`Token data is invalid JSON e - ${e.message}`);
            }

            if (!tokenDataValidator.validate(tokenData)) {
                throw new Error(`Invalid token data extracted from DB - err: ${JSON.stringify(tokenDataValidator.lastError)}`);
            }

            return tokenData;
        });
    };

    readonly createAccessEntry = async (contextId: ContextId, permissions: AccessConfiguration): Promise<TokenData["token"]> => {

        if (!accessConfigurationValidator.validate(permissions)) {
            throw new Error(`Invalid access configuration: ${JSON.stringify(accessConfigurationValidator.lastError)}`);
        }

        const data: TokenData = {
            token: await this.createNewToken(),
            contextId,
            ...permissions
        };

        if (!tokenDataValidator.validate(data)) {
            throw new Error(`Cannot save invalid token data - err: ${JSON.stringify(tokenDataValidator.lastError)}`);
        }

        await this.db.run(`
                    INSERT INTO access_token(token, context_id, configuration)
                    VALUES (?, ?, ?);
            `,
            [data.token, data.contextId, JSON.stringify(data)]
        );
        return data.token;
    };

    readonly deleteTokenData = async (tokenId: TokenData["token"]): Promise<boolean> => {
        const {changes} = await this.db.run(`
                    DELETE
                    FROM access_token
                    WHERE token = ?
            `,
            [tokenId]
        );
        return !!changes;
    };

    private async createNewToken() {
        const {db: {get}} = this;
        const token = new Array(3)
            .fill(0)
            .map(_ => Math.floor(Math.random() * 0xFFFFFF))
            .map(v => v.toString(32))
            .join("-");

        let iterations = 0;
        while (true) {
            const result = await get(`
                        SELECT 1
                        FROM access_token
                        WHERE token = ?`,
                [token]
            );
            if (!result) {
                return token;
            }
            if (iterations++ > 10) {
                throw new Error(`New token takes too many iterations to generate!`);
            }
        }

        return null;
    }
}

