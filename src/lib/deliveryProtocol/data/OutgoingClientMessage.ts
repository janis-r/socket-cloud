export type OutgoingClientMessage = {
    payload: string
    // Message id to reference when channel restore is invoked, to identify from which point
    // messages should be restored
    mid?: string,
};

