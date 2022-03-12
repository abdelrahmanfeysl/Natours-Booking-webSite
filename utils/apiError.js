//THIS IS CLASS ERROR TO DETECT OPERATIONAL ERROR
class apiError extends Error{
  constructor(message,statusCode) {
    super(message);
    //PATH TO SUPER CLASS CONSTRUCTOR THE MESSAGE THAT CREATE IN SUB CLASS ONLY PROP CALLED MESSAGE
    this.statusCode=statusCode;
    //THE ERROR STATUS CODE
    this.status=`${statusCode}`.startsWith('4')? 'fail':'error';
    //IF STATUS CODE = 404 ITS MEANS FAIL ELSE = 500 THAT MEANS ERROR
    this.isOperational =true;
    //THAT WE WILL USE TO CHECK IF THIS ERROR IS OPERATIONAL ERROR OR PROGRAMING ERROR

    Error.captureStackTrace(this,this.constructor);
    //THAT USE TO NOT ADD THIS CLASS TO STACK TRACE => IS A STACK THAT INCLUDE WHERE IS THE ERROR AND IN WHICH LINE
  }
}

module.exports=apiError;