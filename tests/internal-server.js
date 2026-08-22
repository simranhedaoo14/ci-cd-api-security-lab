const http = require('http');

const server = http.createServer((req, res) => {
    console.log(`Internal service received: ${req.method} ${req.url}`);

    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });

    res.end('INTERNAL SERVICE - SHOULD NOT BE ACCESSIBLE THROUGH THE API');
});

server.listen(4000, '127.0.0.1', () => {
    console.log('Internal test service running at http://127.0.0.1:4000');
});