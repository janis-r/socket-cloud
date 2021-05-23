import cluster from "cluster";
import os from "os";

const getServerId = () => [].concat(...Object.values(os.networkInterfaces())).find(({ family, internal }) => family === 'IPv4' && !internal).address;
const prefix = cluster?.worker?.id ? `w${cluster?.worker?.id}` : getServerId();

let mid = 0;

export function nextIpcMessageId(): string {
    const id = mid++;
    mid %= 0xFFFF;
    return `${prefix ?? ''}#${id}`;
}


