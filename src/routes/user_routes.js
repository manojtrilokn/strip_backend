const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const user_controller = require('../controllers/user_controller');
const { userAuth } = require('../middleware/auth');

const imageStorage = multer.diskStorage({
    destination: 'uploads',
    filename: (request, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const imageUpload = multer({
    storage: imageStorage,
    limits: {
        fileSize: 60 * 1024 * 1024
    },
});

router.post('/requestOTP', user_controller.requestOTP);
router.post('/signUp', user_controller.signUp);
router.post('/signIn', user_controller.signIn);
router.get('/getProfile', userAuth, user_controller.getProfile);
router.post('/completeProfile', userAuth, user_controller.completeProfile);


// router.post('/createStripeCustomer', userAuth, user_controller.createStripeCustomer);
// router.get('/retrieveStripeCustomer', userAuth, user_controller.retrieveStripeCustomer);
// router.get('/removeCustomer', userAuth, user_controller.removeCustomer);
// router.post('/updateCustomer', userAuth, user_controller.updateCustomer);

router.post('/createCardToken', userAuth, user_controller.createCardToken);
router.post('/addCardToCustomer', userAuth, user_controller.addCardToCustomer);
router.post('/getAddedCards', userAuth, user_controller.getAddedCards);
router.post('/removeCard', userAuth, user_controller.removeCard);

router.post('/createConnectAccount', userAuth, imageUpload.fields([
    { name: 'front_document' }, { name: 'back_document' }
]), user_controller.createConnectAccount);
router.get('/getConnectAccount', userAuth, user_controller.getConnectAccount);


router.post('/addExternalAccount', userAuth, user_controller.addExternalAccount);
router.get('/getExternalAccounts', userAuth, user_controller.getExternalAccounts);
router.post('/deleteExternalAccount', userAuth, user_controller.deleteExternalAccount);
router.post('/setDefaultExternalAccount', userAuth, user_controller.setDefaultExternalAccount);
router.get('/getConnectAccountList', userAuth, user_controller.getConnectAccountList);


router.post('/createCheckoutSession', userAuth, user_controller.createCheckoutSession);
router.post('/createPayment', user_controller.createPayment);
router.post('/createPayment2', user_controller.createPayment2);
router.post('/webhook', user_controller.webhook);




module.exports = router;