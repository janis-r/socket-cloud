import {ChildProcess, exec} from "child_process";
import psTree from "ps-tree";
import {Timer} from "ugd10a";

let child: ChildProcess;

export const launchServer = (mode: "js" | "ts" = "ts") => new Promise<void>(async resolve => {
    stopServer();

    const exePath = mode === "ts" ? `ts-node ${__dirname}/../../dev-server/single-core.ts` : `node ${__dirname}/../../dev-server/single-core.js`;
    console.log('>> run:', exePath);
    const time = new Timer();
    child = exec(exePath);
    child.stderr.on("error", error => {
        console.log(error)
        // throw new Error(error.message);
    });
    child.stdout.on("data", async chunk => {
        const text = typeof chunk === "string" ? chunk : (chunk instanceof Buffer ? chunk.toString("utf8") : null);
        if (text.includes("[error]")) {
            throw new Error(text.match(/\[error\].*/)[0]);
        }
        if (text && text.includes('[console] Http server running on port')) {
            console.log(text, `\nServer initialized in ${time.elapsed} ms`);
            resolve();
        }
    });
});

export const stopServer = () => {
    if (child) {
        killProcessTree(child.pid);
    }
    child = null;
};

function killProcessTree(pid: number, signal = 'SIGKILL'): void {
    psTree(pid, (err, children) =>
        [pid].concat(children.map(p => p.PID))
            .forEach(tpid => {
                try {
                    process.kill(tpid, signal)
                } catch (ex) {
                }
            })
    );
}

