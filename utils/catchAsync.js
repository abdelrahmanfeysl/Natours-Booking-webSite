const catchAsync = fn => {
  return (req,res,next)=>
  {
    fn(req,res,next).catch(next);
  }
}
module.exports= catchAsync

/*
we use catchAsync to catch errors in Async function and send them into error handler middleware
async function return promise so that we make it like that here if where error promise reject
and return error ,and we catch it with catch , we return function in catchAsync function because that
function we use catchAsync with it ,it must be function not result of calling function ,so we
return a function to assign to this function to make it equal function not result.
we make catch(next) like that because next will run and take param that catch return
 */