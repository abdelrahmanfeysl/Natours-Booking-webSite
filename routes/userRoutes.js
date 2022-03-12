const express = require('express');
const userController=require('./../controllers/userControllers')
const authController=require('../controllers/authControllers')


const Router=express.Router();//make router to assign to the resource routes tp make it easy




//we make special path for signUp with post only because we need post only don't need to make route() to assign all methods
Router.post('/signUp',authController.signUp);
//user only who can make sign up or log in not admin
Router.post('/logIn',authController.login);
Router.get('/logout',authController.logout);
Router.post('/forgetPassword',authController.forgetPassword);
Router.patch('/resetPassword/:token',authController.resetPassword);


Router.use(authController.protect);
/*
that if all routes after this line all of them need to be authenticated ,so that
we use this here middleware that will run before all after routes and make them
authenticated
 */

Router.patch('/updatePassword',authController.updatePassword);
Router.patch('/updateMe',
             userController.uploadUserPhoto,
             userController.resizeUserPhoto,
             userController.updateMe);
Router.delete('/deleteMe',userController.deleteMe);
Router.get('/Me',userController.getMe,userController.getUser);

Router.use(authController.restrictTo('admin'))
/*
that if all routes after this line all of them need to be authorized ,so that
we use this here middleware that will run before all after routes and make them
authorized
 */

//ROUTES FOR USER RESOURCE
Router.route('/').get(userController.getAllUsers)
                      .post(userController.PostUser);

Router.route('/:id').get(userController.getUser)
                         .patch(userController.patchUser)
                         .delete(userController.deleteUser);
//admin who can show users or delete user or create user

module.exports=Router;