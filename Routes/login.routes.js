module.exports = app => {
    const user = require("../Controllers/login.controller");  
    var router = require("express").Router();    
    router.post("/login", user.auth);
    app.use('/api/user', router);
};