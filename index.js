const osc = require("node-osc");
const ws = require("ws");
const http = require("http");

const OSC_SERVER_PORT = 9000;
const OSC_SERVER_ADDRESS = "127.0.0.1";

const OSC_CLIENT_PORT = 9001;
const OSC_CLIENT_ADDRESS = "127.0.0.1";

const WS_SERVER_PORT = 8090;
const WS_SERVER_ADDRESS = "127.0.0.1";

const HTTP_SERVER_PORT = 8091;
const HTTP_SERVER_ADDRESS = "127.0.0.1";

var osc_server = new osc.Server(OSC_SERVER_PORT, OSC_SERVER_ADDRESS);
var osc_client = new osc.Client(OSC_CLIENT_ADDRESS, OSC_CLIENT_PORT);
var ws_server = new ws.Server({ port: WS_SERVER_PORT, host: WS_SERVER_ADDRESS });

var osc_table = {};

var http_server = http.createServer((req, res) => {
    if (req.method === "GET") {
        if (req.url in osc_table) {
            res.writeHead(200, {"Content-Type": "text/plain"});
            res.end(osc_table[req.url]);

            // console.debug(`Get parameter ${req.url}: "${osc_table[req.url]}"`);
        } else {
            res.writeHead(404, {"Content-Type": "text/plain"});
            res.end("404 Not Found");

            // console.debug(`Failed to get parameter ${req.url}: Not found`);
        }
    } else if (req.method === "POST") {
        var body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });
    
        req.on("end", () => {
            osc_client.send(req.url, body, (err) => {
                if (err) console.error(`OSC Error: ${err}`);
            });

            res.writeHead(200, {"Content-Type": "text/plain"});
            res.end("OK");

            // console.debug(`Set parameter ${req.url}: "${body}"`);
        });

    } else {
        res.writeHead(405, {"Content-Type": "text/plain", "Allow": "GET"});
        res.end("405 Method Not Allowed");
    }
});

ws_server.on("connection", function connection(socket) {
    console.log("Websocket client connected");

    socket.on("message", function incoming(raw) {
        var message = raw.toString().split(",");
        
        osc_client.send(message[0], message[1], (err) => {
            if (err) console.error(`OSC Error: ${err}`);
        });
    });

    socket.on("close", function close() {
        console.log("Websocket client disconnected");
    });
});

osc_server.on("message", (raw) => {
    var message = raw.toString().split(",");
    osc_table[message[0]] = message[1];

    ws_server.clients.forEach(function each(client) {
        if (client.readyState === ws.OPEN) {
            client.send(message.toString());
        }
    });
});

osc_server.on("listening", () => {
    console.log(`OSC server listening on udp://${OSC_SERVER_ADDRESS}:${OSC_SERVER_PORT}/`);
    console.log(`OSC client connected to udp://${OSC_CLIENT_ADDRESS}:${OSC_CLIENT_PORT}/`);
});

ws_server.on("listening", () => {
    console.log(`Websocket server listening on ws://${WS_SERVER_ADDRESS}:${WS_SERVER_PORT}/`);
});

http_server.listen(HTTP_SERVER_PORT, () => {
    console.log(`HTTP server listening on http://${HTTP_SERVER_ADDRESS}:${HTTP_SERVER_PORT}/`);
});

