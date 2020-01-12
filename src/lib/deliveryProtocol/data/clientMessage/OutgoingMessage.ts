import {ChannelId} from "../ChannelId";

export type OutgoingMessage = {
    /**
     * Message payload
     */
    payload: string
    /**
     * Message id to reference when channel restore is invoked, to identify from which point
     * messages should be restored
     */
    mid?: string,
    /**
     * List of channels (or single channel) this message is sent to.
     */
    channels?: ChannelId[]
};

