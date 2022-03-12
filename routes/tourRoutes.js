const express = require('express');
const tourController=require('./../controllers/tourControllers');
const authController=require('./../controllers/authControllers');
const reviewController=require('./../controllers/reviewController');
const reviewRouter=require('./../routes/reviewRoutes');

const Router=express.Router();

/*Router.param('id',tourController.checkID);
  Router.param => that is a middleware we use it to select a param we use in url and make in it
  route handler about what we need to do on it like ( id ) we make route handler in it to check if
  it is true or false
 */

//NESTED ROUTES
//POST tours/:tourId/reviews
//Get  tours/:tourId/reviews
//Get  tours/:tourId/reviews/reviewId
/*Router.route('/:tourId/reviews').post(authController.protect,
                                           authController.restrictTo('user'),
                                           reviewController.postReview);*/
/*we not use this way in the future to make nested routes because this make duplicated code
  ,so we use the coming role*/
Router.use('/:tourId/reviews',reviewRouter);
/*
that to make nested routes that like which we do in app.js when we hit route go this router ,so we
make like it here when hit '/:tourId/reviews' go to reviewRouter
 */

Router.route('/top-5-cheap')
  .get(tourController.alias,tourController.GetAllTours)
//alias => is a middleware we use to execute it before execute the function that with it in the same method
//here we execute alias then execute GetAllTours

Router.route('/tours-stat').get(tourController.getTourStats);
Router.route('/monthly-plan/:id').get(authController.protect,  //to achieve authentication
                                         authController.restrictTo('admin','guide-lead','guide') //to achieve authorization
                                       ,tourController.getMonthlyPlan);

//ROUTES FOR TOUR RESOURCE
Router.route('/')
  .get(tourController.GetAllTours) //we use this protect fun here to check if the user log in that he can access to show all tours if not log in can't access
  .post(authController.protect,  //to achieve authentication
    authController.restrictTo('admin','guide-lead'), //to achieve authorization
    /*[[[tourController.checkBody,*/tourController.PostTour);
/* we can call more than one middleware in the route and then this middleware will execute in order we
   call it like we call here we call checkBody here to check if req contain body or not before we
   go to the post middleware
 */
Router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getTourWithin);
Router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

Router.route('/:id')
  .get(tourController.getTour)
  .patch(authController.protect,  //to achieve authentication
         authController.restrictTo('admin','guide-lead'), //to achieve authorization,
         tourController.uploadTourImages,
         tourController.resizeTourImages
         ,tourController.patchTour)
  .delete(authController.protect,  //to achieve authentication
          authController.restrictTo('admin','guide-lead') //to achieve authorization
         ,tourController.deleteTour); //the action that the authorization make you to do



module.exports=Router;