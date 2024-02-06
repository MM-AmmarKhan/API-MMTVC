module.exports = app => {
    const user = require("../Controllers/dashboard.controller");  
    var router = require("express").Router();     
    router.post("/home", user.homepage);
    router.post("/sidebar", user.sidebar);
    router.post("/search", user.searchCommercial);
    router.post("/searchBrand", user.searchCommercialBySubcategory);
    router.post("/dateCommercials", user.dateCommercials);
    router.post("/getAdByDateBrandDuration", user.getAdByDateBrandDuration);
    router.post("/messages",user.messages);
    router.post("/getProfile",user.getProfile);
    router.post("/notification",user.notification);
    router.post("/getAdByCaptionID",user.captionIDCommercials);
    app.use('/api/main', router);
};