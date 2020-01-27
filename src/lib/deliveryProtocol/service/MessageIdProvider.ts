export abstract class MessageIdProvider {
    abstract readonly nextMessageId: () => string;
}
