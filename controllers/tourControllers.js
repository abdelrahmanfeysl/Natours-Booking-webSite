const Tour=require('./../models/tourModel')
const apiFeatures=require('./../utils/apiFeatures')
const catchAsync=require('./../utils/catchAsync')
const apiError=require('./../utils/apiError')
const factory=require('./factoryHandlers');
const multer = require("multer");
const sharp = require("sharp");


const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) { // making sure that it is an image
    cb(null, true);
  } else {
    cb(new apiError('Not an image! please upload only images.', 400), false); // remember that you AppError extends Error class so that way this is working I guess
  }
};

const upload = multer({
  storage:multerStorage,
  fileFilter:multerFilter
});



// this in case we want to upload more than one img and in more than one field, like more than one field to update or save in the database
exports.uploadTourImages = upload.fields([
  {name:'imageCover', maxCount: 3},
  {name:'images',maxCount: 3}
])

//this in case we want to upload more than one img but from one field
// upload.array('images', 3);

// in case of one image
// upload.single('image')


exports.resizeTourImages = catchAsync(async (req,res,next)=>{

  if (!req.files.imageCover || !req.files.images) next(); // if images did not update so just skip this middleware

  //1 resizing cover image
  const imageCoverFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000,1333)
    .toFormat('jpeg')
    .jpeg({quality:90})
    .toFile(`public/img/tours/${imageCoverFilename}`);

  req.body.imageCover= imageCoverFilename;

  //2 resizing images
  req.body.images= [];
  await Promise.all(req.files.images.map(async (file,i)=>{
    const filename = `tour-${req.params.id}-${Date.now()}-${i+1}.jpeg`
    await sharp(file.buffer)
      .resize(2000,1333)
      .toFormat('jpeg')
      .jpeg({quality:90})
      .toFile(`public/img/tours/${filename}`);
    req.body.images.push(filename);
  }))

  next();
})


exports.alias=(req,res,next)=>
{
  /*this is a middleware we use to put some values to this query and then use it without to
    need to write this values again in request in postman
   */
  req.query.limit='5';
  req.query.sort='-ratingsAverage,price';
  next();
}


exports.GetAllTours=factory.getAll(Tour);

/*
exports.GetAllTours=async (req, res,next) => {


  //query..filter().sort().limitingFields().paginate();
  //first function execute return query and then second function use this query to execute and  return query and then
  //Execute Query
  const features=new apiFeatures(Tour.find(),req.query).filter()
                                                       .sort()
                                                       .limitingFields()
                                                        .paginate()
  //we make object from apiFeatures and path to it first query and req.query
  //Tour.find()=> return query which we will pass

  const tours=await features.query;

  res.status(200).json(
    {
      status:'success',
      result:tours.length,
      requestTime:req.timeRequest,
      data:{
        tours:tours
      }})

};
*/


exports.getTour=factory.getOne(Tour,{path:'reviews'})//second populate option if we want to populate


/*exports.getTour=async (req, res,next) => { //to get tour by id

    const tour=await Tour.findById(req.params.id).populate('reviews');
    //Tour.findById => get the ele in DB that have this id and return promise include this element in DB

  //if there was no tour with this ID in Database ,if we change the mongo id then return null because of that we do this if
  if(!tour)
  {
    return  next(new apiError('No tour is valid by that ID',404));
  }

  res.status(200).json(
      {
        status:'success',
         data:{
           tour
         }})

};*/

exports.PostTour=factory.createOne(Tour);

/*exports.PostTour=async (req, res,next) => {

    /!*const newTour =new Tour({DATA}); //the old way to create doc and save to DB
      newTour.save();
     *!/
    const newTour=await Tour.create(req.body)//create doc from the data the client entered
    //Tour.create => is used to create doc from the tour model and return promises of the new doc in DB
    //if the client entered any variable that don`t define in the schema the doc will not include this variable
    res.status(201).json({ //201 refer to Created
      status:'success',
      data:{
        tours:newTour
      }
    }) //we send response to client with the data he entered


  };*/


exports.patchTour=factory.updateOne(Tour);
/*
exports.patchTour=catchAsync(async(req, res,next) => {

  const tour=await Tour.findByIdAndUpdate(req.params.id,req.body, {
    new: true,    //use for return the new doc that updated
    runValidators: true  //use for rerun the validator that we write in Schema about variables
  })
  //to update the doc and return promise that contain the doc that updated

  if(!tour)
  {
    return  next(new apiError('No tour is valid by that ID',404));
  }

    res.status(200).json({
      status:"success",
      data:{
        tour:tour
    }

  })

});
*/

//here we replace with factory handler that we want to not duplicate code of delete in each controller that we call deleteOne and pass to it the model
exports.deleteTour=factory.deleteOne(Tour);
/*exports.deleteTour=catchAsync(async(req, res,next) => {

 const tour= await Tour.findByIdAndDelete(req.params.id)
  //to update the doc and return promise that contain the doc that updated

  if(!tour)
  {
    return  next(new apiError('No tour is valid by that ID',404));
  }

  res.status(204).json({
    status:"success",
    data:{
      tour:null
    }
  })

});*/

exports.getTourStats=async (req,res,next)=>
{

    const stats=await Tour.aggregate([
      {
        $match :{ratingsAverage :{$gte:4.5}}
      },
      {
        $group:{
          _id :{ $toUpper :'$difficulty'},
          numTours:{$sum:1},
          numRating:{$sum:'$ratingsQuantity'},
          averageRate : {$avg:'$ratingsAverage'},
          averagePrice : {$avg:'$price'},
          minPrice: {$min:'$price'},
          maxPrice: {$max:'$price'}
        }
      },
      {
        $sort : {averagePrice :1}
      }
    ])
    res.status(200).json({
      status:"success",
      data:{
        stats
      }
    })

};
exports.getMonthlyPlan=async (req,res,next)=>{

    const year=req.params.year*1 || 1;
    const plan =await Tour.aggregate([
      {
        $unwind : '$startDates'
      },
      {
        $match : {
          startDates:{
            $gte:new Date(`${year}-01-01`),
            $lte:new Date(`${year}-12-31`),
          }
        }
      },
      {
        $group:{
          _id:{$month:'$startDates'},
          numToursStart:{$sum:1},
          tours:{$push:'$name'}
        }
      },
      {
        $addFields:{month:'$_id'}
      },
      {
        $project :{
          _id:0
        }
      }
    ])
    res.status(200).json({
      status:"success",
      data:{
        plan
      }
    })

};

// /tours-within/200/center/34.111745,-118.113491/unit/mi
//i make record with this video named video 170
exports.getTourWithin=async (req,res)=>{
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {

     throw new apiError(
        'Please provide latitude and longitude in the format lat,lng.',
        400
      )

  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
}
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new apiError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});

/********************************we do not have use again*********************************/
/********************************this controllers use files not DB************************/
/*
const fs = require('fs');

const tours=JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours.json`));
/!* we make function fs.read here because to be a top code and execute one time only when run program,
   and  we will use it multi-times and don`t put it in callback fun.
   json.parse => to convert json to JS object.
 *!/

exports.checkID=(req,res,next,val)=>
{
  if(req.params.id>tours.length)
  {
    return res.status(404).json({
      status:'fail',
      message:"ID is wrong"
    })
  }
  next();
}

//that a middleware we can use to check about a param ,and we make it because we do not need to write
this check more than once in every middleware, so we make it once and use it before we go to the routes

exports.checkBody=(req,res,next)=>
{
  if(!(req.body.hasOwnProperty('name')&&req.body.hasOwnProperty('price')))
  {
    return res.status(400).json({
      status:'bad Request'
    })
  }
  next();
}
//this is middleware is used to check if req contain body or not before we
 go to the post middleware


exports.getTour=((req, res) => { //to get tour by id
  // to take para use : before the param you want .
     to take more than one param like that /:id/:name that require you to input the two variables if entered one and other NO
     that make error if you want to enter one and escape other vars make the rute like that => /:id/:name?
     that make variable name optional if you don`t input that don`t make error.

console.log(req.params); //req.params that include all params in URL
const id = Number(req.params.id);
//that convert the param id from string to integer
const tour=tours.find(ele=> ele.id===id)
//find => that fun that return array of all elements that make that condition
if(id>tours.length)
{
  res.status(404).json({
    status:'fail',
    message:"ID is wrong"
  })
}
res.status(200).json(
  {
    status:'success',
    data:{
      tour
    }})
});

exports.PostTour=((req, res) => {
  console.log(tours[tours.length-1].id);
  const newTourID =tours[tours.length-1].id+1;  //every tour must have id
  const newTour   =Object.assign({id:newTourID},req.body);
  //Object.assign() => is used to merge two object to create one object
  tours.push(newTour);//we put the new tour to the array of tours then we must overwrite the array to the json file
  fs.writeFile(`${__dirname}/dev-data/data/tours.json`,JSON.stringify(tours),() =>
  {
    //JSON.stringify()=> is used to convert JS Object to json
    //201 => refer to ( create ) like 200 refer to ( ok ).
    res.status(201).json({
      status:'success',
      data:{
        tours:newTour
      }
    }) //we send response to client with the data he entered
  })
});

*/
