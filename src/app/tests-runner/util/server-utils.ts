import {ChildProcess, exec} from "child_process";
import psTree from "ps-tree";
import {Timer} from "ugd10a";
import chalk from "chalk";

let serverProcess: ChildProcess;

export const launchServer = (showLogs = false, mode: "js" | "ts" = "ts") => new Promise<void>(async resolve => {
    stopServer();

    const isTs = __filename.match(/\.ts$/);
    const executable = isTs ? 'ts-node' : 'node';
    const path = `${__dirname}/../../dev-server/single-core.${isTs ? 't' : 'j'}s`;

    const exePath = `${executable} ${path}`;
    showLogs && logToConsole('>> run:', exePath);

    const time = new Timer();
    serverProcess = exec(exePath);
    serverProcess.stdout.on("data", async chunk => {
        const text = typeof chunk === "string" ? chunk : (chunk instanceof Buffer ? chunk.toString("utf8") : null);
        showLogs && logToConsole(text);
        if (text && text.includes('Http server running on port')) {
            showLogs && logToConsole(`in ${time.elapsed} ms`);
            resolve();
        }
    });
});

export const stopServer = () => {
    if (serverProcess) {
        killProcessTree(serverProcess.pid);
    }
    serverProcess = null;
};

export const serverIsRunning = () => !!serverProcess;

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

function logToConsole(...entries: Array<any>): void {
    console.log(...entries.map(value => chalk.white(chalk.bgBlack(value))));
}
