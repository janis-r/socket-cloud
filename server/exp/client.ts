const net = require('net');

const client = new net.Socket();
client.connect(8080, '127.0.0.1', () => {
    console.log('Connected');
    // client.write('Hello, server! Love, Client.');
});

let i = 0;
client.on('data', (data: any) => {
    console.log('Received: ' + data);
    // i++;
    // if(i==2)
    //     client.destroy();
});
client.on('close', function() {
    console.log('Connection closed');
});
