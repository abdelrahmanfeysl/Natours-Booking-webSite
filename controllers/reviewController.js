const Review =require('./../models/reviewModel')
const factory=require('./factoryHandlers');



exports.getAllReviews=factory.getAll(Review);

/*exports.getAllReviews=async (req,res)=>{
  let filter ={};
  if(req.params.tourId) filter={tour:req.params.tourId}
  /!* to check if the route is nested route or original route so if we want all reviews of certain route
     or we want to get all reviews of all tour
     //POST tours/:tourId/reviews when we need reviews of one tour so check if include tourId or not
     //POST /reviews  if like that , we want all reviews of all tours ,so if the tour not include
       tourId that mean it is not nested route.
  *!/

  const reviews=await Review.find(filter);

  res.status(200).json({
    status:'success',
    results:reviews.length,
    data:{
      reviews
    }
  })
}*/

//we make this middleware because we want to make post review like the function we create in factory to make it can use make it similar to it and make this middleware before it
exports.setUserAndTourId=(req,res,next)=>
{
  if(!req.body.tour) req.body.tour=req.params.tourId; //because if we use nested routes
  if(!req.body.user) req.body.user=req.user.id; //because if we use nested routes

  next();
}

/*exports.postReview=async (req,res)=>{
 if(!req.body.tour) req.body.tour=req.params.tourId; //because if we use nested routes
 if(!req.body.user) req.body.user=req.user.id; //because if we use nested routes

  const review=await Review.create(req.body);

  res.status(200).json({
    status:'success',
    data:{
      review
    }
  })
}*/

exports.getReview=factory.getOne(Review);
exports.postReview=factory.createOne(Review);
exports.patchReview=factory.updateOne(Review);
exports.deleteReview=factory.deleteOne(Review);