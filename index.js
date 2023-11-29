require('dotenv').config();
const Sequelize = require("sequelize");

const sequelize = new Sequelize(process.env.MAINDBDATABASE, process.env.MAINDBUSERNAME, process.env.MAINDBPASSWORD, {
    host: process.env.MAINSERVER,
    dialect: 'mysql',
    define: {
        timestamps: false,
        freezeTableName: true
    }
});

const db = {};
db.Sequelize = Sequelize;

// Import Models
db.sequelize = sequelize;
// db.AdminUser = require("./Models/adminUser")(sequelize, Sequelize);
// db.company = require("./Models/Company")(sequelize, Sequelize);
// sequelize.sync()
//   .then(() => {
//     console.log('Database schema synced.');
//   })
//   .catch((err) => {
//     console.error('Unable to sync database schema:', err);
//   });
module.exports = db;