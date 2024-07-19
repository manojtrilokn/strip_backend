const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db_conn');

const User = sequelize.define("users", {
    first_name: { type: DataTypes.STRING, defaultValue: '' },
    middle_name: { type: DataTypes.STRING, defaultValue: '' },
    last_name: { type: DataTypes.STRING, defaultValue: '' },
    mobile: { type: DataTypes.STRING, defaultValue: '' },
    email: { type: DataTypes.STRING, defaultValue: '' },
    dob: { type: DataTypes.STRING, defaultValue: '' },
    password: { type: DataTypes.STRING, defaultValue: '' },
    profile_photo: { type: DataTypes.STRING, defaultValue: '' },
    profile_photo_thumbnail: { type: DataTypes.STRING, defaultValue: '' },
    gender: {
        type: DataTypes.INTEGER, defaultValue: 0,
        comment: '1=male 2=female 3=other'
    },
    is_profile_setup: {
        type: DataTypes.INTEGER, defaultValue: 0,
        comment: '1=yes 0=no'
    },
    access_token: { type: DataTypes.TEXT, defaultValue: '' },
    device_token: { type: DataTypes.TEXT, defaultValue: '' },
    device_type: {
        type: DataTypes.INTEGER, defaultValue: null,
        comment: '1=ios 2=android'
    },
    customer_id: { type: DataTypes.STRING, defaultValue: null },
    connect_account_id: { type: DataTypes.STRING, defaultValue: null },
});

module.exports = User;