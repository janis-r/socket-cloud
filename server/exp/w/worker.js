const http = require("http");
const url = require("url");

http.createServer((req, res) => {
    res.writeHead(200);
    res.end('hello world\n');

    // parse url
    var parsed = url.parse(req.url, true);
    console.log('woker', process.pid);

    // // retrieve query
    // var query = {fwd: parsed.query};
    //
    // // forward query
    // process.send(query);
    //
    // // this request is done
    // res.end(JSON.stringify({'result': '0'}));

}).listen(8000);
