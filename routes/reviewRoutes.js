const express = require('express');
const reviewController=require('./../controllers/reviewController')
const authController=require('./../controllers/authControllers');


const Router=express.Router({mergeParams:true});
/*we use mergeParams because every route can get access only with his route params ,so mergeParams
 make the route access to params of last route of it like here in this router ('/') and last route
 '/:tourId/reviews' that we want to make '/' to access to params like (':tourId)
 */

Router.use(authController.protect);
//NESTED ROUTES
//POST tours/:tourId/reviews
//POST /reviews
//each of this routes get to this router to execute

Router.route('/').post(authController.restrictTo('user'), //to authorizer who will do this operation
                           reviewController.setUserAndTourId,
                            reviewController.postReview)
                      .get(reviewController.getAllReviews)

Router.route('/:id').get(reviewController.getReview)
                         .delete(authController.restrictTo('user','admin')
                           ,reviewController.deleteReview)
                         .patch(authController.restrictTo('user','admin'),
                            reviewController.patchReview);


module.exports=Router;

