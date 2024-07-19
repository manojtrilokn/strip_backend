const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const {API_MESSEGE} = require('../utils/api_message');

exports.userAuth = async (req, res, next) => {
    try {
        const token = req.headers['authorization'].replace('Bearer ', '');
        jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
            if (err) {
                return res.json({
                    status: 4,
                    message: API_MESSEGE.INVALID_ACCESS_TOKEN
                });
            } else {
                User.findOne({ where: { id: decoded.user_id, access_token: token } }).then((user_data) => {
                    if (!user_data) {
                        return res.json({
                            status: 4,
                            message: API_MESSEGE.INVALID_ACCESS_TOKEN
                        });
                    }
                    if(user_data.is_active === 0){
                        return res.json({
                            status:0,
                            message:API_MESSEGE.ACCOUNT_INACTIVE
                        });
                    }
                    req.user_id = user_data.id;
                    next();
                }).catch(err => {
                    return res.json({
                        status: API_MESSEGE.INVALID_SERVER_TOKEN,
                        message: err.toString()
                    });
                })
            }
        })
    } catch (err) {
        return res.json({
            status: 4,
            message: API_MESSEGE.INVALID_ACCESS_TOKEN
        });
    }
};