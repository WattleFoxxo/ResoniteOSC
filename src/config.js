const fs = require('fs');

function loadJSON(path) {
    try {
        const data = fs.readFileSync(path);
        return JSON.parse(data);
    } catch (err) {
        console.error("Error loading config file: ", err);
        return {};
    }
}

function saveJSON(path, data) {
    try {
        const jsonData = JSON.stringify(data, null, 2);
        fs.writeFileSync(path, jsonData);
        console.log("Config file saved");
    } catch (err) {
        console.error("Error saving config file: ", err);
    }
}

module.exports = {
    loadJSON,
    saveJSON
};
