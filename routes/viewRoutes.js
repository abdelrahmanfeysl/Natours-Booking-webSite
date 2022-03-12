const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authControllers');
const bookingController = require('../controllers/bookingControllers');

const router = express.Router();

router.get('/',bookingController.createBookingCheckout,authController.isLoggedIn, viewsController.getOverview);
router.get('/tour/:slug',authController.isLoggedIn,  viewsController.getTour);
router.get('/login',authController.isLoggedIn, viewsController.getLoginForm);
router.get('/me',authController.protect,  viewsController.getAccount);
router.get('/signup', authController.isLoggedIn, viewsController.getSignupForm);
router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData
);
router.get('/my-tours', authController.protect, viewsController.getMyTours);
module.exports = router;
