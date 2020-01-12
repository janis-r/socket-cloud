import {Event} from "qft";
import {ContextId} from "../../configurationContext";
import {OutgoingMessage} from "../data";
import {ExternalId} from "../../clientConnectionPool";

export class OutgoingMessageEvent extends Event {
    static readonly TYPE = Symbol("outgoing-message");

    private readonly recipientProviders = new Set<RecipientCountProvider>();
    private recipientCount = 0;

    constructor(readonly contextId: ContextId,
                readonly message: OutgoingMessage,
                readonly externalIds?: ExternalId[]) {
        super(OutgoingMessageEvent.TYPE);
    }

    readonly addRecipientProvider = (provider: RecipientCountProvider): void => {
        this.recipientProviders.add(provider);
        provider.then(value => this.recipientCount += value);
    };

    async getRecipientCount(): Promise<number> {
        await Promise.all(this.recipientProviders);
        return this.recipientCount;
    }
}

type RecipientCountProvider = Promise<number>;
