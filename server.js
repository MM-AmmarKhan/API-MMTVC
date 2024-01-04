require("./index.js");
const express = require('express');
const https = require('https');
const fs = require('fs');
var app = express();
const cors = require("cors");
var port = process.env.PORT || 3000;
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 100 requests per windowMs
  });
app.use("/", limiter);
app.use((req, res, next) => {
    req.url = req.url.replace(/\/{2,}/g, '/');
    next();
});
app.use(cors({
    origin: '*',
    maxAge: 129600,//Approx 1 days 12 hours
    allowedHeaders: ['Accept', 'Content-Type', 'Authorization', 'X-Custom-Header','api_access_key','API_ACCESS_KEY','access-token','SECRET_KEY'],
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.get("/", (req, res) => {    
    res.status(200).send({ message: "MMTVC-APP" });
});
if (process.env.NODE_ENV === 'production') {    
    const privateKey = fs.readFileSync('/etc/letsencrypt/live/aiksalaryaur.pk/privkey.pem', 'utf8');
    const certificate = fs.readFileSync('/etc/letsencrypt/live/aiksalaryaur.pk/fullchain.pem', 'utf8');
    const credentials = { key: privateKey, cert: certificate };
    const httpsServer = https.createServer(credentials, app);
    httpsServer.listen(port, '0.0.0.0');
    console.log('Running in production mode');
} else if(process.env.NODE_ENV === 'local'){
    console.log('Running in local mode');
    app.listen(port,'172.168.98.15');
}else{
    console.log('Running in development mode');
    app.listen(port);
}

require('./Routes/activitylog.routes.js')(app);
require('./Routes/dashboard.routes.js')(app);
require('./Routes/login.routes.js')(app);
require('./Routes/notifications.routes.js')(app);
console.log("Listeing on "+port);

module.exports = app;
