const moment = require("moment");

function formatMsg(username, text) {
    return {
        username,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
}

module.exports = formatMsg;
