export interface WebsocketExtensionExecutor {
    /**
     * Transformation action to be applied on incoming data frame payload
     * @param payload
     */
    transformIncomingData?(payload: Buffer): Buffer | Promise<Buffer>;
}
