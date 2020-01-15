import {Context, WebApplicationBundle} from "qft";
import {Logger} from "../../lib/logger";
import {HttpServerRouter} from "../../lib/httpServer";
import {DevServerModule} from "./devServerModule";


const {injector} = new Context().install(...WebApplicationBundle).configure(DevServerModule).initialize();

const router = injector.get(HttpServerRouter);
router.get('/', ({sendFile}) => sendFile(`${__dirname}/index.html`));

router.post('/validationAPI/validate-connection', ({body, sendJson}) => {
    const response = {externalId: "1234"};
    console.log('>> validate-connection', {body, response});
    sendJson(response);
});

injector.get(Logger).console(`Dev server context initialized`);
