const apiError=require('./../utils/apiError')

//to handle cast error like to get tour with invalid id
const handleCastErrorDB=err=> {
  const message =`invalid ${err.path}: ${err.value}`
  //err.path => name of field (_id) ,err.value => is the value of path that you entered
  return new apiError(message,400)
}

//to handle duplicated field value like you enter name of tour duplicated
const handleDuplicatedFieldsDB=err=>{
  const value =err.errmsg.match(/(["'])(\\?.)*\1/);
  //regular expression to get the duplicated value you entered from errMsg
  const message=`Duplicate field value= ${value}. please use another value!`
  return new apiError(message,400)
}

//to handle validation err in database like entered rating greater than 5 or value of name very short
const handleValidationErrorsDB=err=>{
  const errors =Object.values(err.errors).map(el =>el.message);
  //to get errors messages from err.errors object to show to the client
  const message=`invalid input data : ${errors.join('. ')} `;
  return new apiError(message,400);
}

const handleJwtError=()=>{
  return  new apiError('Invalid token,please log in again',401);
}
const handleJwtExpiredError=()=>{
  return  new apiError('your token has expired!,please log in again',401);
}
const sendDev=(err,req,res)=>
  {
    // A) API
    if (req.originalUrl.startsWith('/api')) {
      return res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
      });
    }

    // B) RENDERED WEBSITE
    console.error('ERROR 💥', err);
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }
const sendProd=(err,req,res)=>
{
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('ERROR 💥', err);
    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }

  // B) RENDERED WEBSITE
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    console.log(err);
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }
  // B) Programming or other unknown error: don't leak error details
  // 1) Log error
  console.error('ERROR 💥', err);
  // 2) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.'
  });

}
/*
when we pass four params to function express know that it is a global error handling middleware
 */
module.exports=(err,req,res,next)=>{
  err.statusCode =err.statusCode ||500;
  err.status =err.status ||'error';

  if(process.env.NODE_ENV==='development')
    sendDev(err,req,res);
  else if(process.env.NODE_ENV==='production') {
   let error={...err};
   error.message=err.message;
   if(err.name==='CastError') error=handleCastErrorDB(err);
   if(err.code===11000) error=handleDuplicatedFieldsDB(err);
   if(err.name==="ValidationError") error=handleValidationErrorsDB(err);
    if(err.name==="JsonWebTokenError") error=handleJwtError();
    if(err.name==="TokenExpiredError") error=handleJwtExpiredError();
    sendProd(error, req,res);
  }
}