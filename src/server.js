const osc = require("node-osc");
const ws = require("ws");
const http = require("http");

class Server {
    constructor(options) {
        options = options || {};
        console.error = console.debug = console.info = console.log = options.logger;
        
        this.STATUS = options.status;

        console.log("Starting server...");
        this.STATUS(1);

        this.OSC_SERVER_PORT = options.config.oscServerPort || 9000;
        this.OSC_SERVER_ADDRESS = options.config.oscServerAddress || "127.0.0.1";

        this.OSC_CLIENT_PORT = options.config.oscClientPort || 9001;
        this.OSC_CLIENT_ADDRESS = options.config.oscClientAddress || "127.0.0.1";

        this.WS_SERVER_PORT = options.config.wsServerPort || 8090;
        this.WS_SERVER_ADDRESS = options.config.wsServerAddress || "127.0.0.1";

        this.HTTP_SERVER_PORT = options.config.httpServerPort || 8091;
        this.HTTP_SERVER_ADDRESS = options.config.httpServerAddress || "127.0.0.1";

        this.osc_table = {};

        this.osc_server = new osc.Server(this.OSC_SERVER_PORT, this.OSC_SERVER_ADDRESS);
        this.osc_client = new osc.Client(this.OSC_CLIENT_ADDRESS, this.OSC_CLIENT_PORT);
        this.ws_server = new ws.Server({ port: this.WS_SERVER_PORT, host: this.WS_SERVER_ADDRESS });

        this.http_server = http.createServer((req, res) => this.handleHTTPRequest(req, res));
        
        this.osc_server.on("message", (raw) => this.handleOSCMessage(raw));
        this.ws_server.on("connection", (socket) => this.handleWSConnection(socket));

        this.http_server.listen(this.HTTP_SERVER_PORT, () => {
            console.log(`HTTP server listening on http://${this.HTTP_SERVER_ADDRESS}:${this.HTTP_SERVER_PORT}/`);
        });

        this.osc_server.on("listening", () => {
            console.log(`OSC server listening on udp://${this.OSC_SERVER_ADDRESS}:${this.OSC_SERVER_PORT}/`);
            console.log(`OSC client connected to udp://${this.OSC_CLIENT_ADDRESS}:${this.OSC_CLIENT_PORT}/`);
        });

        this.ws_server.on("listening", () => {
            console.log(`Websocket server listening on ws://${this.WS_SERVER_ADDRESS}:${this.WS_SERVER_PORT}/`);
        });
        
        this.STATUS(2);
    }

    handleHTTPRequest(req, res) {
        if (req.method === "GET") {
            if (req.url in this.osc_table) {
                res.writeHead(200, {"Content-Type": "text/plain"});
                res.end(this.osc_table[req.url]);
            } else {
                res.writeHead(404, {"Content-Type": "text/plain"});
                res.end("404 Not Found");
            }
        } else if (req.method === "POST") {
            let body = "";
            req.on("data", (chunk) => {
                body += chunk.toString();
            });

            req.on("end", () => {
                this.osc_client.send(req.url, body, (err) => {
                    if (err) console.error(`OSC Error: ${err}`);
                });

                res.writeHead(200, {"Content-Type": "text/plain"});
                res.end("OK");
            });
        } else {
            res.writeHead(405, {"Content-Type": "text/plain", "Allow": "GET"});
            res.end("405 Method Not Allowed");
        }
    }

    handleWSConnection(socket) {
        console.log("Websocket client connected");

        socket.on("message", (raw) => {
            const message = raw.toString().split(",");
            this.osc_client.send(message[0], message[1], (err) => {
                if (err) console.error(`OSC Error: ${err}`);
            });
        });

        socket.on("close", () => {
            console.log("Websocket client disconnected");
        });
    }

    handleOSCMessage(raw) {
        const message = raw.toString().split(",");
        this.osc_table[message[0]] = message[1];

        this.ws_server.clients.forEach((client) => {
            if (client.readyState === ws.OPEN) {
                client.send(message.toString());
            }
        });
    }

    close() {
        this.http_server.close();
        this.ws_server.close();
        this.osc_server.close();
        console.log("Stopped server");
        this.STATUS(0);
    }
}

module.exports = Server;
