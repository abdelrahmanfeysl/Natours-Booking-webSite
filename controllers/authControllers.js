const User = require('./../models/userModel');
const apiError = require('./../utils/apiError');
const Email = require('./../utils/email');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');


//we do all function about authentication here like sign up or log in

const createSendToken = (user, statusCode,req, res) => {
  const token = tokenSign(user._id);
  const cookiesOption = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRS_IN * 24 * 60 * 60 * 1000),
    httpOnly: true, //with that the cookie can not access or modified by any way with the browser
    secure:req.secure || req.headers('x-forwarded-proto') === 'https'
    //it uses to be the cookie work only in secure protocols   like https
  };

  res.cookie('jwt', token, cookiesOption);
  //here we create a cookie and send first the name of it and second the value of it and third option of it

  //that make password don't show on the output of postman
  user.password = undefined;

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};


const tokenSign = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRS_IN
  });
  //to create token call jwt.sign and then pass three params :
  //1)payload => this is data which we went to save about user and here we save id
  //2)secret => it is the secret that stored in server which use to create token
  //3)options =>here we make expires date like after 90 day token will be invalid even signature is correct
};


exports.signUp = async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
    photo: req.body.photo
  });
//when we make user sign up it make log in directly ,and we must create jwt for him and send to him when sign up
  const url=`${req.protocol}://${req.get('host')}/Me`
  await new Email(newUser,url).sendWelcome();
  createSendToken(newUser, 201,req, res);
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  //it means put in email and password the same variables name in body like that email =req.body.email

  //first check if user enter the password and email
  if (!email || !password) {
    throw new apiError('you must enter the password and the email', 400);
  }
  //second check is user exist and password is correct
  const user = await User.findOne({ email }).select('+password');
  //we use select here to select password to return in user and use + before password because we make password in schema with option select false

  if (!user || !(await user.correctPassword(password, user.password))) {
    throw new apiError('Incorrect email or password', 401);
  }

  //third create token and send back to user to know that he is log in
  createSendToken(user, 200,req, res);
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

//MIDDLEWARE TO PROTECT ROUTES TO CHECK IF USER LOG IN THEN HE CAN USE THIS ROUTES
exports.protect = async (req, res, next) => {
  //1)Getting token and check if its there exist
  let token;
  //the token will user send in the header of request
  // to will be like that authorization :Bearer tnvknvkn   =>that word after Bearer is the token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }else if (req.cookies.jwt){
    token = req.cookies.jwt; // to be able to authenticate via cookie too
  }
  if (!token) {
    throw new apiError('You are not log in', 401);
  }

  //2) Verification token to check if it is correct token or not
  const decodePayload = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  /* here jwt.verify is async fun , it uses callback fun after execution , we want to not use
   callback fun we want to change to promise function ,so we use promisify to convert it from
   use callback function to be promise and return promise so you put it in promisify and the second
   part (token,process.env.JWT_SECRET) => that means we call jwt.verify and pass two params to it
   */

  //3)Check if user still exists ,if not deleted
  const freshUser = await User.findOne({ _id: decodePayload.id });
  if (!freshUser) {
    throw new apiError('this user belonging to this token is not exist', 401);
  }
  //4)Check if the user changed password after the token was issued
  if (freshUser.changedPasswordAfter(decodePayload.iat)) { //check if the password changed after token issued then sent error
    throw new apiError('User recently changed password! Please log in again', 401);
  }

  res.locals.user = freshUser;
  req.user = freshUser;
  /*
  req is walk throw all middlewares one after one then if you went to send thing from middleware
  to another send by using req put this thing in variable in req and send it
   */

  //GRANT ACCESS TO PROTECT ROUTE
  next();
};
// Only for rendered pages, no errors!
// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    // 1) verify token
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (e) {
      return next();
    }
  }
  next();
};


//TO MAKE AUTHORIZATION TO CHOOSE WHO CAN HAVE PERMISSION TO ACCESS SOME ROUTES
exports.restrictTo = (...roles) => { // (roles) is array of who can have permission like ['admin','guide-lead']
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) { //req.user.role that come from before middleware when assign the fresh user to variable user in req
      throw new apiError('You don`t have permission to perform this action', 403);
    }
    next();
  };
  /*
  we make the middle ware like that be return of another function because we want to pass some params to
  this function ,so we make fun and pass params to it and then make it return fun of middle ware like we do
   */
};

exports.forgetPassword = async (req, res) => {
  //1)Get user based on Posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    throw new apiError('There is no user with email address', 404);
  }

  //2)Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  //here make the reset token
  console.log(resetToken);
  await user.save({ validateBeforeSave: false });
  //here we will save user because the arbitrates of user that we define when create token will be saving in DB


  //3)send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    //this url this will send in email and user will use to make request reset password
    await new Email(user,resetURL).sendPasswordRest();
    res.status(200).json({
      status: 'success'
    });
  } catch (e) {
    //when error happen reset password reset token and password reset expires and save user again
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    throw new apiError('There was an error sending the email.try again later!', 500);
  }

};

exports.resetPassword = async (req, res) => {
  //1)Get user based on token because he sent only token in request
  const encryptedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: encryptedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  /* here we encrypt the original token send in the request to encrypted one that stored in DB of user,
     and search with this encrypted token to get this user that want to reset password ,
     first find by encrypt token ,second check if passwordResetExpires is greater than the time now ,that
     mean that token is not expired yet , if one of this two condition false findOne not return any user
   */

  //2)If token has not expired ,and there is user ,set the password
  if (!user) {
    throw new apiError('Token is invalid or has expired ', 500);
  }
  //if the user exist then reset password and remove reset token and reset expires and save the user
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //validators run only again when we use save not update

  //3)UPDATED changedPasswordAt property for the user
  //we make that when create document middleware in user.model to update changedPasswordAt if the password changed

  //4)Log in user ,send JWT
  createSendToken(user, 201,req, res);

};

exports.updatePassword = async (req, res) => {
  //1)Get the user from the collection
  const user = await User.findById(req.user.id).select('+password');

  //2)Check if current posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    throw new apiError('Incorrect email or password', 401);
  }

  //3)IF so,update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //4)log user in,send JWT;
  createSendToken(user, 200,req, res);
};

