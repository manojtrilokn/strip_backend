const jwt = require('jsonwebtoken');

exports.generateToken = (user_id) => {
    return new Promise((resolve, reject) => {
        const payload = {user_id:user_id};
        const secret = process.env.JWT_KEY;
        const options = {
            issuer: 'MNJ'
        };
        jwt.sign(payload, secret, options, (err, token) => {
            if (err) {
                reject(err)
            }
            resolve(token)
        })
    });
};

exports.capitalizeFirstLetter = async (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};