const mongoose=require('mongoose')
const User=require('./../models/userModel');
const Tour=require('./../models/tourModel');

const reviewSchema=new mongoose.Schema({
  review:{
    type:String,
    require:[true,'Review can not be empty']
  },
  rating:{
    type:Number,
    min:[1,'rating must be above 1.0'],
    max:[5,'rating must be below 5.0']
  },
  createdAt:{
   type:Date,
   default:Date.now()
  },
  user: {   //here we do parent reference ,so that we make object of reference not array of object because we want one object only ,in child reference we want array of object
      type:mongoose.Schema.ObjectId,
      ref:'User',
      require:[true,'Review must belong to tour']
    },
  tour: {
    type:mongoose.Schema.ObjectId,
    ref:'Tour',
    require:[true,'Review must belong to User']
  }
},{
  toJSON:{ virtuals:true},
  toObject:{ virtuals:true}
  /*we use this two options to can show the virtual prop when get data and toJson
    that we use when data show in json format and toObject when data show in object format
   */
})


reviewSchema.index({tour:1,user:1},{unique:true});
//that make each user can make only one review for every tour

reviewSchema.pre(/^find/,async function(next) {
  /*this.populate({
    path:'user',
    select:'name photo'
  }).populate({
        path:'tour',
        select:'name'
      });*/
                /*
                here we populate only user not tour because we will populate reviews when we get tour,
                so we will get tour in it reviews in it tour so multi populate ,so that we delete populate
                tour in review and leave populate reviews in tour only
                 */
  this.populate({
    path:'user',
    select:'name photo'
  })
  next();
})


/*this is a static method that we called with Model like Review.calcAverageRantings , we use it
to calc average rating after create or update or delete review for certain tour ,so we create this function
and path to it the id of tour that we will create review to it and calc average and assign to the ratingsQuantity
and ratingsAverage to the tour
 */
reviewSchema.statics.calcAverageRantings=async function(tourId) {
  const stats=await this.aggregate([
    {
      $match:{tour:tourId}
    },
    {
      $group:{
         _id: '$tour',
         nRating:{ $sum : 1 },
         avgRating:{$avg:'$rating'}
        }
    }
  ])
  if(stats.length>0){
  await Tour.findByIdAndUpdate(tourId,{
    ratingsQuantity:stats[0].nRating,
    ratingsAverage:stats[0].avgRating
  })
  }else{
    await Tour.findByIdAndUpdate(tourId,{
      ratingsQuantity:0,
      ratingsAverage:4.5
    })
  }
}

reviewSchema.post('save',function(){
  //this work for create only because save work on save and create only
  this.constructor.calcAverageRantings(this.tour);
  /*this constructor here refer to Model (review) because calcAverageRantings run only with model like that
  Review.calcAverageRantings and the model don't define yet , we use that here because the model don't
  create yet
   */
})

//findByIdAndUpdate
//findByIdAndDelete
/*
we will work with this queries
*/
// findByIdAndUpdate
// findByIdAndDelete
//i make record for this two middlewares you will find it in this folder in course
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne().clone();
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  // await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calcAverageRantings(this.r.tour);
});
const Review=mongoose.model('Review',reviewSchema);

module.exports=Review;