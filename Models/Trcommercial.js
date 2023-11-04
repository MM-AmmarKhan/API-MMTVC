const { DataTypes } = require('sequelize');
module.exports = (sequelize, Sequelize) => {
    const newsms_person = sequelize.define('trcommercial', {
        commercialID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        segmentDetailID: {
            type: DataTypes.INTEGER,
            allowNull: false,            
        },
        channelID: {
            type: DataTypes.INTEGER,
            allowNull: false,            
        },
        captionID: {
            type: DataTypes.INTEGER,
            allowNull: false,            
        },
        transDate: {
            type: DataTypes.DATE
        },
        startTime: {
            type: DataTypes.DATETIME,
            defaultValue: Sequelize.NOW
        },
        endTime: {
            type: DataTypes.DATETIME,
            defaultValue: Sequelize.NOW
        },
        videoClipID: {
            type: DataTypes.STRING(30),
            allowNull: false
        },
        duration: {
            type: DataTypes.FLOAT,
            defaultValue:1
        }
        }, {
        // Other model options go here
    });
    return newsms_person
}