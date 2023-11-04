const express = require('express');
var app = express();
require("./index.js");
const cors = require("cors");
var port = process.env.PORT || 3000;
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // limit each IP to 100 requests per windowMs
  });
app.use("/", limiter);
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
    console.log('Running in production mode');
    app.listen(port, '0.0.0.0');
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
console.log("Listeing on "+port);

module.exports = app;
