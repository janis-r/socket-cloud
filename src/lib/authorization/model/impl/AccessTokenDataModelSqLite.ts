import {SqLiteConnection} from "../../../sqLite";
import {AccessTokenDataModel} from "../AccessTokenDataModel";
import {TokenData, tokenDataValidator} from "../../data/TokenData";
import {ContextId} from "../../../configurationContext/data/ContextId";

export class AccessTokenDataModelSqLite implements AccessTokenDataModel {

    private readonly db: SqLiteConnection;

    constructor() {
        try {
            this.db = new SqLiteConnection("access-token");
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

    readonly saveTokenData = async (data: TokenData): Promise<boolean> => {
        if (!tokenDataValidator.validate(data)) {
            throw new Error(`Cannot save invalid token data - err: ${JSON.stringify(tokenDataValidator.lastError)}`);
        }

        const {changes} = await this.db.run(`
                    INSERT OR
                    REPLACE
                    INTO access_token(token, context_id, configuration)
                    VALUES (?, ?, ?);
            `,
            [data.token, data.contextId, JSON.stringify(data)]
        );
        return !!changes;
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
}

