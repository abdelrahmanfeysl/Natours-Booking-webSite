const catchAsync = require('./../utils/catchAsync');
const apiError = require('./../utils/apiError');
const Tour = require('./../models/tourModel');
const apiFeatures = require('./../utils/apiFeatures');


//Here we make deleteOne return this handler function that delete any document for any model
exports.deleteOne=  Model=> catchAsync(async(req, res,next) => {

  const doc= await Model.findByIdAndDelete(req.params.id)
  //to update the doc and return promise that contain the doc that updated

  if(!doc)
  {
    return  next(new apiError('No Document is valid by that ID',404));
  }

  res.status(204).json({
    status:"success",
    data:{
      document:null
    }
  })
});

exports.updateOne=Model => catchAsync(async(req, res,next) => {

  const doc=await Model.findByIdAndUpdate(req.params.id,req.body, {
    new: true,    //use for return the new doc that updated
    runValidators: true  //use for rerun the validator that we write in Schema about variables
  })
  //to update the doc and return promise that contain the doc that updated

  if(!doc)
  {
    return  next(new apiError('No document is valid by that ID',404));
  }

  res.status(200).json({
    status:"success",
    data:{
      data:doc
    }

  })

});

exports.createOne=Model => async (req, res) => {

  /*const newTour =new Tour({DATA}); //the old way to create doc and save to DB
    newTour.save();
   */
  const doc=await Model.create(req.body)//create doc from the data the client entered
  //Tour.create => is used to create doc from the tour model and return promises of the new doc in DB
  //if the client entered any variable that don`t define in the schema the doc will not include this variable
  res.status(201).json({ //201 refer to Created
    status:'success',
    data:{
      doc
    }
  }) //we send response to client with the data he entered

};

exports.getOne=(Model,populateOption)=>async (req, res) => { //to get tour by id

  let query=Model.findById(req.params.id);
  if(populateOption) query=query.populate(populateOption);
  //if we use populate with get doc ,so you must pass populate options in function and check if we want (populate) or not
  const doc=await query;



  //if there was no doc with this ID in Database ,if we change the mongo id then return null because of that we do this if
  if(!doc)
  {
  throw new apiError('No document is valid by that ID',404);
  }

  res.status(200).json(
    {
      status:'success',
      data:{
        data:doc
      }})

};

exports.getAll=Model=>async (req, res) => {

  //it will be using For reviews only
  let filter ={};
  if(req.params.tourId) filter={tour:req.params.tourId}
  /* to check if the route is nested route or original route so if we want all reviews of certain route
       or we want to get all reviews of all tour
       //POST tours/:tourId/reviews when we need reviews of one tour so check if include tourId or not
       //POST /reviews  if like that , we want all reviews of all tours ,so if the tour not include
         tourId that mean it is not nested route.
    */

 // -------------------------------------------------------
  //query..filter().sort().limitingFields().paginate();
  //first function execute return query and then second function use this query to execute and  return query and then
  //Execute Query
  const features=new apiFeatures(Model.find(filter),req.query).filter()
    .sort()
    .limitingFields()
    .paginate()
  //we make object from apiFeatures and path to it first query and req.query
  //Model.find()=> return query which we will pass

 // const docs=await features.query.explain();
  const docs=await features.query;

  res.status(200).json(
    {
      status:'success',
      result:docs.length,
      requestTime:req.timeRequest,
      data:{
        data:docs
      }})

};
