import {launchServer} from "./util/server-utils";

(async () => {
    let i = 0;
    while (++i < 10) {
        console.log('>> start', i);
        await launchServer();
    }
})();
