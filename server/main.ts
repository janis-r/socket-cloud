import * as net from "net";

/*const server = net.createServer(socket => {

    socket.addListener()
    socket.on()

})*/

let clientCount = 0;
const server = net.createServer((socket) => {
    console.log('new socket!')
    // socket.end('goodbye\n');
    socket.write('Heello ' + clientCount++);

    socket.on("error", (err) => console.log('>> error', err))

}).on('error', (err) => {
    // Handle errors here.
    throw err;
});

// Grab an arbitrary unused port.
server.listen({
    host: '127.0.0.1',
    port: 8080
},() => {
    console.log('opened server on', server.address());
});
