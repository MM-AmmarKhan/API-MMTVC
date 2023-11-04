const { DataTypes } = require('sequelize');
module.exports = (sequelize, Sequelize) => {
    const newsms_client = sequelize.define('newsms_client', {
        clientID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        description: {
            type: DataTypes.STRING(62),
            allowNull: false
        },
        company:{
            type: DataTypes.STRING(62),
            allowNull: false
        },
        address:{
            type: DataTypes.STRING(62),
            defaultValue:0
        },
        phone: {
            type: DataTypes.STRING(15),
            defaultValue:1
        },
        website: {
            type: DataTypes.DATE,
            defaultValue: Sequelize.NOW
        },
        s_date: {
            type: DataTypes.DATE,
            defaultValue: Sequelize.NOW
        },
        e_date: {
            type: DataTypes.DATE,
            defaultValue: Sequelize.NOW
        },
        isactive :{
            type: DateTypes.BOOLEAN,
            defaultValue:0
        }        
        }, {
        // Other model options go here
    });
    return newsms_client
}