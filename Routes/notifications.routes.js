module.exports = app => {
    const user = require("../Controllers/notifications.controller");  
    var router = require("express").Router();
    router.post("/alert", user.tvcalert);
    app.use('/api/notification', router);
};