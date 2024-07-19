const { API_MESSEGE } = require('../utils/api_message');
const { Op } = require("sequelize");
const utils = require('../utils/utils');
const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const TempOTP = require('../models/otp.model');
const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_KEY);



exports.requestOTP = async (req, res, next) => {
    if (req.body.mobile === '' || req.body.mobile === undefined) {
        return res.json({
            status: 0,
            message: 'Mobile number is required.'
        })
    }
    try {
        const otp = "1234";
        const otp_detail = await TempOTP.findOne({ where: { mobile: req.body.mobile.trim() } });
        if (otp_detail) {
            otp_detail.otp = otp;
            const otp_details = await otp_detail.save();
            //**** Function (otp_detail.mobile, otp_detail.otp);
            res.json({
                status: 1,
                message: API_MESSEGE.MOBILE_OTP_SENT,
                otp: otp_details.otp
            });
        } else {
            const otp_details = await TempOTP.create({ mobile: req.body.mobile, otp: otp });
            //**** Function(otp_detail.mobile, otp_detail.otp);
            res.json({
                status: 1,
                message: API_MESSEGE.MOBILE_OTP_SENT,
                otp: otp_details.otp
            });
        }
    } catch (err) {
        next(err);
    }
};

exports.signUp = async (req, res, next) => {
    if (req.body.email === '') {
        return res.json({
            status: 0,
            message: 'Email is required.'
        })
    }
    if (req.body.mobile === '') {
        return res.json({
            status: 0,
            message: 'Mobile number is required.'
        })
    }

    if (req.body.otp === '') {
        return res.json({
            status: 0,
            message: 'OTP is required.'
        })
    }
    if (req.body.password === '') {
        return res.json({
            status: 0,
            message: 'Password is required.'
        })
    }
    try {
        const user_mobile_data = await User.findOne({ where: { mobile: req.body.mobile.trim() } });
        if (user_mobile_data) {
            return res.json({
                status: 0,
                message: API_MESSEGE.MOBILE_ALREADY_USED
            });
        }
        const user_email_data = await User.findOne({ where: { email: req.body.email.trim() } });
        if (user_email_data) {
            return res.json({
                status: 0,
                message: API_MESSEGE.EMAIL_ALREADY_USED
            });
        }
        const otp_detail = await TempOTP.findOne({ where: { [Op.and]: [{ mobile: req.body.mobile.trim() }, { otp: req.body.otp }] } });
        if (!otp_detail) {
            return res.json({
                status: 0,
                message: API_MESSEGE.INVALID_MOBILE_OR_OTP
            })
        }
        const user_detail = await User.create({
            email: req.body.email.trim(),
            mobile: req.body.mobile.trim(),
            device_token: req.body.deviceToken,
            device_type: req.body.deviceType,
            first_name: await utils.capitalizeFirstLetter(req.body.firstName),
            middle_name: await utils.capitalizeFirstLetter(req.body.middleName),
            last_name: await utils.capitalizeFirstLetter(req.body.lastName),
            password: await bcrypt.hash(req.body.password.trim(), 10)
        });
        TempOTP.destroy({ where: { mobile: user_detail.mobile.trim() } });
        const token = await utils.generateToken(user_detail.id.toString());
        const customer = await stripe.customers.create({
            email: req.body.email,
            name: req.body.firstName + " " + req.body.lastName,
            phone: req.body.mobile
        });

        user_detail.access_token = token;
        user_detail.customer_id = customer.id;
        const user_details = await user_detail.save();
        let res_data = {
            userId: user_details.id,
            accessToken: user_details.access_token
        };
        res.json({
            status: 1,
            message: API_MESSEGE.REGISTER_SUCCESS,
            data: res_data,
            customer: customer
        });
    } catch (err) {
        next(err);
    }
};

exports.signIn = async (req, res, next) => {
    if (req.body.email === '' || req.body.email === undefined) {
        return res.json({
            status: 0,
            message: 'Email is required.'
        })
    }
    if (req.body.password === '' || req.body.password === undefined) {
        return res.json({
            status: 0,
            message: 'Password is required.'
        })
    }
    try {
        const user_detail = await User.findOne({ where: { email: req.body.email.trim() } });
        if (!user_detail) {
            return res.json({
                status: 0,
                message: API_MESSEGE.INVALID_LOGIN_CREDENTIAL
            });
        }

        const isMatched = await bcrypt.compare(req.body.password.trim(), user_detail.password);
        if (!isMatched) {
            return res.json({
                status: 0,
                message: API_MESSEGE.INVALID_LOGIN_CREDENTIAL
            });
        }
        if (user_detail.is_active === 0) {
            return res.json({
                status: 0,
                message: API_MESSEGE.ACCOUNT_INACTIVE
            })
        }
        const token = await utils.generateToken(user_detail.id.toString());
        user_detail.access_token = token;
        user_detail.device_token = req.body.deviceToken;
        const user_details = await user_detail.save();

        let res_data = {
            userId: user_details.id,
            firstName: user_details.first_name,
            middleName: user_details.middle_name,
            lastName: user_details.last_name,
            mobile: user_details.mobile,
            email: user_details.email,
            gender: user_details.gender,
            profilePhoto: user_details.profile_photo === '' ? '' : process.env.BASE_URL + user_details.profile_photo,
            profilePhotoThumbnail: user_details.profile_photo_thumbnail === '' ? '' : process.env.BASE_URL + user_details.profile_photo_thumbnail,
            accessToken: user_details.access_token
        };
        res.json({
            status: 1,
            message: API_MESSEGE.LOGIN_SUCCESS,
            data: res_data
        });
    } catch (err) {
        next(err);
    }
};

exports.getProfile = async (req, res, next) => {
    try {
        const user_id = req.user_id;
        const user_detail = await User.findOne({
            attributes: [
                'id', ['first_name', 'firstName'], ['middle_name', 'middleName'], ['last_name', 'lastName'], 'email', 'mobile'
            ],
            where: { id: user_id }
        });
        res.json({
            status: 1,
            data: user_detail,
            message: API_MESSEGE.PROFILE_FOUND
        });
    } catch (err) {
        next(err);
    }
};

exports.completeProfile = async (req, res, next) => {

    if (req.body.firstName === '' || req.body.firstName === undefined) {
        return res.json({
            status: 0,
            message: 'First name is required.'
        })
    }
    if (req.body.middleName === undefined) {
        return res.json({
            status: 0,
            message: 'Middle name is required.'
        })
    }
    if (req.body.lastName === '' || req.body.lastName === undefined) {
        return res.json({
            status: 0,
            message: 'Last name is required.'
        })
    }
    try {
        const user_id = req.user_id;
        await User.update(
            {
                first_name: await utils.capitalizeFirstLetter(req.body.firstName),
                middle_name: await utils.capitalizeFirstLetter(req.body.middleName),
                last_name: await utils.capitalizeFirstLetter(req.body.lastName),
                is_profile_setup: 1
            },
            { where: { id: user_id } }
        );
        const user_detail = await User.findOne({
            attributes: [
                'id', ['first_name', 'firstName'], ['middle_name', 'middleName'], ['last_name', 'lastName'], 'email', 'mobile'
            ],
            where: { id: user_id }
        });
        res.json({
            status: 1,
            data: user_detail,
            message: API_MESSEGE.PROFILE_COMPLETED
        });
    } catch (err) {
        next(err);
    }
};

exports.createStripeCustomer = async (req, res, next) => {
    const user_id = req.user_id;
    if (req.body.email === '') {
        return res.json({
            status: 0,
            message: 'Email is required.'
        })
    }
    try {
        const customer = await stripe.customers.create({
            email: req.body.email,
            name: req.body.name,
            phone: req.body.phone
        });
        await User.update(
            { customer_id: customer.id },
            { where: { id: user_id } }
        );
        res.json({
            status: 1,
            data: customer,
            message: 'Created !'
        });
    } catch (err) {
        next(err);
    }
};

exports.updateCustomer = async (req, res, next) => {
    try {
        const user_id = req.user_id;
        const user_detail = await User.findOne({ where: { id: user_id } });
        const customer = await stripe.customers.update(
            user_detail.customer_id,
            { email: req.body.email, name: req.body.name }
        );
        res.json({
            status: 1,
            data: customer,
            message: 'Customer updated !'
        });
    } catch (err) {
        next(err)
    }
};

exports.removeCustomer = async (req, res, next) => {
    try {
        const user_id = req.user_id;
        const user_detail = await User.findOne({ where: { id: user_id } });
        const deletedCustomer = await stripe.customers.del(user_detail.customer_id);
        res.json({
            status: 1,
            data: deletedCustomer,
            message: 'Customer removed !'
        });
    } catch (err) {
        next(err)
    }
};

exports.retrieveStripeCustomer = async (req, res, next) => {
    try {
        const user_id = req.user_id;
        const user_detail = await User.findOne({ where: { id: user_id } });
        if (user_detail.customer_id === '' || user_detail.customer_id === null) {
            res.json({
                status: 1,
                data: null,
                message: 'Retrieved !'
            });
        } else {
            const customer = await stripe.customers.retrieve(user_detail.customer_id);
            res.json({
                status: 1,
                data: customer,
                message: 'Retrieved !'
            });
        }
    } catch (err) {
        next(err);
    }
};

exports.createCardToken = async (req, res, next) => {
    try {
        const token = await stripe.tokens.create({
            card: {
                number: req.body.number,
                exp_month: req.body.exp_month,
                exp_year: req.body.exp_year,
                cvc: req.body.cvc
            }
        });

        res.json({
            status: 1,
            data: token,
            message: 'Token created successfully'
        });
    } catch (error) {
        console.error('Error creating token:', error);
        next(error); // Forward the error to the error handling middleware
    }
};

exports.addCardToCustomer = async (req, res, next) => {
    try {
        const user_id = req.user_id;
        const user_detail = await User.findOne({ where: { id: user_id } });
        const card = await stripe.customers.createSource(user_detail.customer_id, {
            source: req.body.token,
        });
        res.json({
            status: 1,
            data: card,
            message: 'Card added !'
        });
    } catch (err) {
        next(err);
    }
};

exports.getAddedCards = async (req, res, next) => {
    try {
        const user_id = req.user_id;
        const user_detail = await User.findOne({ where: { id: user_id } });
        const card_list = await stripe.customers.listSources(
            user_detail.customer_id,
            { object: 'card', limit: 10 });
        res.json({
            status: 1,
            data: card_list,
            message: 'card_list !'
        });
    } catch (err) {
        next(err);
    }
};

exports.removeCard = async (req, res, next) => {
    if (req.body.cardId === '') {
        return res.json({
            status: 0,
            message: 'cardId is required.'
        })
    }
    try {
        const user_id = req.user_id;
        const user_detail = await User.findOne({ where: { id: user_id } });
        const confirmation = await stripe.customers.deleteSource(
            user_detail.customer_id,
            req.body.cardId
        );
        res.json({
            status: 1,
            data: confirmation,
            message: 'Removed !'
        });
    } catch (err) {
        next(err);
    }
};


exports.createConnectAccount = async (req, res, next) => {
    // await stripe.accounts.del("acct_1Pd8y6D0FDKRgr26");
    const dob = new Date(req.body.dob);
    try {
        const user_id = req.user_id;
        var account_detail = await stripe.accounts.create({
            type: req.body.type,
            country: req.body.country,
            email: req.body.email,
            business_type: req.body.business_type,
            business_profile: {
                mcc: '4722',
                url: 'www.abcd.com'
            },
            individual: {
                first_name: req.body.firstName,
                last_name: req.body.lastName,
                email: req.body.email,
                dob: {
                    day: dob.getDate(),
                    month: dob.getMonth() + 1,
                    year: dob.getFullYear()
                },
                phone: req.body.phone,
                address: {
                    line1: req.body.address,
                    city: req.body.city,
                    state: req.body.state,
                    postal_code: parseInt(req.body.postal_code),
                    country: req.body.country,
                },
            },
            requested_capabilities: ['card_payments', 'transfers']
        });
        await acceptTOS(account_detail.id, req.ip);
        const frontDocumentPath = req.files['front_document'][0].path;
        const backDocumentPath = req.files['back_document'][0].path;
        await uploadIdentityDocuments(frontDocumentPath, backDocumentPath, account_detail.id);

        await User.update(
            { connect_account_id: account_detail.id },
            { where: { id: user_id } }
        );
        res.json({
            status: 1,
            data: account_detail,
            message: 'Connect account is Created !'
        });
    } catch (err) {
        if (account_detail) {
            await stripe.accounts.del(account_detail.id);
        }
        next(err);
    }
};

exports.getConnectAccount = async (req, res, next) => {
    try {
        const user_id = req.user_id;
        const user_detail = await User.findOne({ where: { id: user_id } });
        if (user_detail.connect_account_id === null || user_detail.connect_account_id === '') {
            return res.json({
                status: 1,
                data: null,
                message: 'Connect account details.'
            });
        }
        const account = await stripe.accounts.retrieve(user_detail.connect_account_id);
        const bankAccounts = await stripe.accounts.listExternalAccounts(
            user_detail.connect_account_id,
            { object: 'bank_account' }
        );
        res.json({
            status: 1,
            data: account,
            bankAccounts: bankAccounts,
            message: 'Connect account details.'
        });
    } catch (err) {
        next(err);
    }
};


exports.addExternalAccount = async (req, res) => {
    try {
        const user_id = req.user_id;
        const user_detail = await User.findOne({ where: { id: user_id } });
        const token = await stripe.tokens.create({
            bank_account: {
                country: 'AU',
                currency: 'aud',
                account_holder_name: req.body.account_holder_name,
                account_holder_type: req.body.account_holder_type,
                routing_number: req.body.routing_number,
                account_number: req.body.account_number,
            },
        });
        try {
            const externalAccount = await stripe.accounts.createExternalAccount(user_detail.connect_account_id, {
                external_account: token.id,
            });
            res.json({
                status: 1,
                data: externalAccount,
                message: 'External account added successfully!'
            });
        } catch (err) {
            res.json({
                status: 0,
                message: err.message
            });
        }
    } catch (err) {
   
        res.json({
            status: 0,
            message: err.message
        });
    }
};

exports.getExternalAccounts = async (req, res, next) => {
    try {
        const user_id = req.user_id;
        const user_detail = await User.findOne({ where: { id: user_id } });
        const bankAccounts = await stripe.accounts.listExternalAccounts(
            user_detail.connect_account_id,
            { object: 'bank_account' }
        );
        res.json({
            status: 1,
            data: bankAccounts,
            message: 'External banks found !'
        });
    } catch (err) {
        next(err);
    }
};

exports.deleteExternalAccount = async (req, res, next) => {
    try {
        const user_id = req.user_id;
        const user_detail = await User.findOne({ where: { id: user_id } });
        const deletedBankAccount = await stripe.accounts.deleteExternalAccount(
            user_detail.connect_account_id,
            req.body.bankId
        );
        res.json({
            status: 1,
            data: deletedBankAccount,
            message: 'External bank removed !'
        });
    } catch (err) {
        next(err);
    }
};

exports.setDefaultExternalAccount = async (req, res, next) => {
    try {
        const user_id = req.user_id;
        const user_detail = await User.findOne({ where: { id: user_id } });
        const updatedExternalAccount = await stripe.accounts.updateExternalAccount(
            user_detail.connect_account_id,
            req.body.bankId,
            { default_for_currency: true }
        );

        res.json({
            status: 1,
            data: updatedExternalAccount,
            message: 'External Account set as default!'
        });
    } catch (err) {
        next(err);
    }
};

exports.createPayment = async (req, res, next) => {
    const { amount, currency } = req.body;
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: currency,
        });
        res.json({
            status: 1,
            clientSecret: paymentIntent.client_secret,
        })
    } catch (error) {
        next(error)
    }
};

exports.createPayment2 = async (req, res) => {
    const { amount, currency } = req.body;
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: currency,
            application_fee_amount: 200,
            transfer_data: {
                destination: req.body.connect_account_id,
            },
        });

        res.json({
            status: 1,
            clientSecret: paymentIntent.client_secret,
        })
    } catch (error) {
        res.status(500).send({ error: error.message });
    }

};

exports.getConnectAccountList = async (req, res, next) => {
    try {
        const user_id = req.user_id;
        const user_list = await User.findAll({ 
            attributes:['id', ['first_name', 'firstName'],['last_name', 'lastName'], 'connect_account_id'],
            where: { [Op.and]: [{id: {[Op.not]: user_id} }, { connect_account_id: {[Op.not]: null}}] }
        });
        res.json({
            status:1,
            data:user_list,
            message:'Connected account list.'
        })
    } catch (err) {
        next(err)
    }
};

exports.createCheckoutSession = async (req, res, next) => {
    try {
      const products = req.body.products;
     const lineItems = products.map((product) =>({
        price_data:{
            currency:'AUD',
            product_data:{
                name:product.name,
                images:[product.image]
            },
            unit_amount:product.price*100
        },
        quantity:product.quantity
     }));
     const session = await stripe.checkout.sessions.create({
        payment_method_types:['card'],
        success_url: 'https://example.com/success',
        line_items: lineItems,
        mode: 'payment',
        success_url: 'http://localhost:3001/success',
      });
      res.json({
        status:1,
        id:session.id
      })
    } catch (err) {
        next(err)
    }
};

exports.webhook = async (req, res, next) => {
    console.log("Webhook called!")
};

const acceptTOS = async (accountId, ip) => {
    await stripe.accounts.update(accountId, {
        tos_acceptance: {
            date: Math.floor(Date.now() / 1000),
            ip: ip,
        },
    });
};

const uploadIdentityDocuments = async (frontDocumentPath, backDocumentPath, accountId) => {
    const frontFile = await stripe.files.create({
        purpose: 'identity_document',
        file: {
            data: fs.readFileSync(frontDocumentPath),
            name: path.basename(frontDocumentPath),
            type: 'application/octet-stream',
        },
    });
    const backFile = await stripe.files.create({
        purpose: 'identity_document',
        file: {
            data: fs.readFileSync(backDocumentPath),
            name: path.basename(backDocumentPath),
            type: 'application/octet-stream',
        },
    });
    await stripe.accounts.update(accountId, {
        individual: {
            verification: {
                document: {
                    front: frontFile.id,
                    back: backFile.id,
                },
            },
        },
    });
};



