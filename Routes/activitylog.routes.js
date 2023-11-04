module.exports = app => {
    const user = require("../Controllers/activitylog.controller");  
    var router = require("express").Router();    
    router.post("/internal", user.internalShare);  
    router.post("/external", user.externalShare);
    router.post("/createlog", user.createLog);
    app.use('/api/main', router);
};