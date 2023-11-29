module.exports = app => {
    const user = require("../Controllers/dashboard.controller");  
    var router = require("express").Router();     
    router.post("/home", user.homepage);   
    router.post("/search", user.searchCommercial);
    router.post("/dateCommercials", user.dateCommercials);
    router.post("/messages",user.messages);
    app.use('/api/main', router);
};