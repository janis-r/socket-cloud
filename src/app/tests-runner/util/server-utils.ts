import {ChildProcess, exec} from "child_process";
import psTree from "ps-tree";
import {Timer} from "ugd10a";
import chalk from "chalk";

let serverProcess: ChildProcess;

export const launchServer = (singleCore: boolean = true, showLogs = false, mode: "js" | "ts" = "ts") => new Promise<void>(async resolve => {
    stopServer();

    const isTs = __filename.match(/\.ts$/);
    const executable = isTs ? 'ts-node' : 'node';
    const path = `${__dirname}/../../dev-server/${singleCore ? 'single' : 'multi'}-core.${isTs ? 't' : 'j'}s`;

    const exePath = `${executable} ${path}`;
    showLogs && logToConsole('>> run:', exePath);

    const time = new Timer();
    serverProcess = exec(exePath);
    serverProcess.stderr.on("data", err => {
        throw err;
    });
    serverProcess.stdout.on("data", async chunk => {
        const text = typeof chunk === "string" ? chunk : (chunk instanceof Buffer ? chunk.toString("utf8") : null);
        if (text && text.includes(singleCore ? 'Http server running on port' : 'All workers started')) {
            logToConsole(`${text.replace(/\s+$/, '')} [in ${time.elapsed} ms]`);
            resolve();
        } else if (showLogs) {
            logToConsole(text.replace(/\s+$/, ''));
        }
    });
});

export const stopServer = () => {
    if (!serverProcess) {
        return false;
    }
    killProcessTree(serverProcess.pid);
    serverProcess = null;
    logToConsole('>> server stopped!');
    return true;
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
