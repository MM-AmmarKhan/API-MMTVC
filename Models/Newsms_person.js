const { DataTypes } = require('sequelize');
module.exports = (sequelize, Sequelize) => {
    const newsms_person = sequelize.define('newsms_person', {
        personID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        clientID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        personName: {
            type: DataTypes.STRING(30),
            allowNull: false
        },
        personNumber: {
            type: DataTypes.STRING(15),
            defaultValue:1
        },
        imei: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        fcm_id:{
            type: DataTypes.TEXT,
            allowNull: false
        },
        gcm_id:{
            type: DataTypes.TEXT,
            defaultValue:0
        },
        username: {
            type: DataTypes.STRING(15)
        },
        email: {
            type: DataTypes.STRING(62)
        },
        isactive :{
            type: DateTypes.BOOLEAN,
            defaultValue:0
        }        
        }, {
        // Other model options go here
    });
    return newsms_person
}