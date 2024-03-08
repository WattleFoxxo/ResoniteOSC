const Server = require("./server");
const Config = require("./config");

var logger = function(message) {
    var consoleBox = document.getElementById("serverConsole");
    var scroll = consoleBox.scrollHeight - consoleBox.scrollTop === consoleBox.clientHeight;
    
    consoleBox.textContent += message + '\n';
    
    if (scroll) consoleBox.scrollTop = consoleBox.scrollHeight;
}

function status(i) {
    var serverStatus = document.getElementById("serverStatus");
    
    switch (i) {
        case 0:
            serverStatus.innerText = "Status: Stopped";
            serverStart.disabled = false;
            openServerConfigBtn.disabled = false;
            break;
        case 1:
            serverStatus.innerText = "Status: Starting";
            break;
        case 2:
            serverStatus.innerText = "Status: Running";
            serverStop.disabled = false;
            break;    
        default:
            break;
    }
}

var server = null;
var serverConfig = Config.loadJSON("./serverConfig.json");

// Server Buttons
var serverStart = document.getElementById("serverStart");
var serverStop = document.getElementById("serverStop");

// Config Menu Buttons
var serverConfigDialog = document.getElementById("serverConfigDialog");
var openServerConfigBtn = document.getElementById("openServerConfig");
var cancelServerConfigBtn = document.getElementById("cancelServerConfig");
var saveServerConfigBtn = document.getElementById("saveServerConfig");

// Config Menu Inputs
var oscServerAddress = document.getElementById("oscServerAddress");
var oscServerPort = document.getElementById("oscServerPort");
var oscClientAddress = document.getElementById("oscClientAddress");
var oscClientPort = document.getElementById("oscClientPort");
var wsServerAddress = document.getElementById("wsServerAddress");
var wsServerPort = document.getElementById("wsServerPort");
var httpServerAddress = document.getElementById("httpServerAddress");
var httpServerPort = document.getElementById("httpServerPort");

serverStart.addEventListener("click", () => {
    serverStart.disabled = true;
    openServerConfigBtn.disabled = true;
    serverStop.disabled = true;

    server = new Server({
        "config": serverConfig,
        "logger": logger,
        "status": status
    });
});

serverStop.addEventListener("click", () => {
    serverStart.disabled = true;
    openServerConfigBtn.disabled = true;
    serverStop.disabled = true;

    server.close();
});

openServerConfigBtn.addEventListener("click", () => {
    oscServerAddress.value = serverConfig.oscServerAddress;
    oscServerPort.value = serverConfig.oscServerPort;

    oscClientAddress.value = serverConfig.oscClientAddress;
    oscClientPort.value = serverConfig.oscClientPort;

    wsServerAddress.value = serverConfig.wsServerAddress;
    wsServerPort.value = serverConfig.wsServerPort;

    httpServerAddress.value = serverConfig.httpServerAddress;
    httpServerPort.value = serverConfig.httpServerPort;

    serverConfigDialog.showModal();
});

cancelServerConfigBtn.addEventListener("click", () => {
    serverConfigDialog.close();
});

saveServerConfigBtn.addEventListener("click", () => {
    serverConfig.oscServerAddress = oscServerAddress.value;
    serverConfig.oscServerPort = oscServerPort.value;

    serverConfig.oscClientAddress = oscClientAddress.value;
    serverConfig.oscClientPort = oscClientPort.value;

    serverConfig.wsServerAddress = wsServerAddress.value;
    serverConfig.wsServerPort = wsServerPort.value;

    serverConfig.httpServerAddress = httpServerAddress.value;
    serverConfig.httpServerPort = httpServerPort.value;

    Config.saveJSON("./serverConfig.json", serverConfig);

    serverConfigDialog.close();
});
