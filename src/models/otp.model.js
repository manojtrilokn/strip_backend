const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db_conn');

const TempOTP = sequelize.define("temp_otps", {
    email: { type: DataTypes.STRING, defaultValue: '' },
    mobile: { type: DataTypes.STRING, defaultValue: '' },
    otp: { type: DataTypes.INTEGER, defaultValue: null }
});

module.exports = TempOTP;