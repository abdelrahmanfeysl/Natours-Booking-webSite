/*******************************************( every thing about express )***************************************/
const express = require('express');
const path=require('path');
require('express-async-errors');
const morgan=require('morgan');
const rateLimit=require('express-rate-limit');
const helmet=require('helmet');
const helmetCsp = require("helmet-csp");
const cookieParser=require('cookie-parser');
const cors=require('cors');
const mongoSanitize=require('express-mongo-sanitize');
const xxs=require('xss-clean');
const hpp=require('hpp');
const compression=require('compression');
const viewRouter = require('./routes/viewRoutes');
const errHandlerMiddleWare=require('./controllers/errorhandler');
const apiError=require('./utils/apiError');
const tourRouter=require('./routes/tourRoutes');
const userRouter=require('./routes/userRoutes');
const reviewRouter=require('./routes/reviewRoutes');
const bookingRouter=require('./routes/bookingRoutes');
const app = express();

app.set('view engine','pug');
app.set('views',path.join(__dirname,'views'));
//morgan is to show the request on the console

//Serving Static files
app.use(express.static(path.join(__dirname,'public') ));

app.use('trust proxy');//to trust proxy for heroku

/*app.use(nocache())*/
//GLOBAL MIDDLEWARE
app.use(cors());
//Set security http headers
app.use(helmet()) //we should put it in the first of middlewares

//development logging
app.use(morgan('dev'));

//middleware to limit number of request that come from the same ip
const limiter=rateLimit({
  max:100, //mean max num of request =100
  windowMs:60*60*1000, //mean max num of request =100 in an hour
  message:'Too many requests from this IP,Please try again in an hour' //error message
})
app.use('/api',limiter); //that mean for all path that start with /api

//Body parser,reading data from the body int req.body
app.use(express.json({limit:'10kb'})) //when put 10kb that mean limit data that come from body to 10 kb
  /* this is middleware that use to modify the incoming request and when we use post we will put data
   to the body of request and here the request don`t have the body of data case of that we use
   middleware to modify the request and put the body of data to the request object to achieve that => (req.body)
   to be available.
 */


app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
//Data Sanitization against NoSql query injection
  app.use(mongoSanitize())
  //we put them after parse body
  //that when hacker put in the body like some query to make him to log in without know the email or the password
  //and mongoSanitize filter req.body and req.param and req.query from any dollar sign or dot to don't write queries on it

//Data sanitization against XXS
 app.use(xxs());
 //that when the hacker put in the body like some html code with some JS code to make your server fail Down
 //and this middleware filter this html code


//Prevent parameter pollution
 app.use(hpp({
   whitelist:['duration','price','maxGroup'] //whiteList is list of fields that we can duplicate in query
 }))
/*
that use when this attack happen when we put in the query duplicated fields like ?sort=price&sort=duration
this will give us error but when we use this middleware that will delete all duplicated and use only last one
 */

app.use(compression())
//to compress all texts that will send to the user



//THIRD MIDDLEWARE
app.use(((req, res, next) => {
/*  console.log('hello from middleware');*/
  next();
}))

//FOURTH MIDDLEWARE
app.use(((req, res, next) => {
  req.timeRequest=new Date().toISOString();
  next();
}))

// Test middleware
/*
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.cookies);
  next();
});
*/


/*make router from our resources every router led to the routes of the resource and the route handlers and
  assign the router use middleware to the base route and then from the routes files complete the path like ( / ) or ( /:id )
 */
app.use('/', viewRouter);
app.use('/api/v1/tours',tourRouter);
app.use('/api/v1/users',userRouter);
app.use('/api/v1/reviews',reviewRouter);
app.use('/api/v1/bookings',bookingRouter);

//A HANDLER FOR UNDEFINED ROUTES
// '*' means for all routes come
app.all('*',((req, res, next) => {

  /*
   we make an object from error and pass to constructor ( error message , err.statusCode) and err.status will create
  in constructor of error class ,and then
  when you call next() and pass to it error like that next(err) ,express know that
  this param is an error and then skip all next middleware and go directly to
  error handling middleware.
   */

  //OLD WAY OF PASS ERROR OBJECT
  //const err =new Error(`can't find ${req.originalUrl} on this server `);
  //err.statusCode=404;
  //err.status='fail';

  throw new apiError(`can't find ${req.originalUrl} on this server `,404);
}))


//GLOBAL ERROR HANDLING MIDDLEWARE
app.use(errHandlerMiddleWare)


module.exports=app;

