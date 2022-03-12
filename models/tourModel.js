const mongoose=require('mongoose');
const User=require('./../models/userModel');
const slugify=require('slugify');
const validator=require('validator');


//to create documentation we should create model to create model you should create schema

//create Schema that use to define variable and validate data and another option like the ex.
const tourSchema=new mongoose.Schema({
  name:{
    type:String,
    required:[true,'tour must have a name'],
    unique:true,
    minLength:[10,'name must have more than or equal 10 letters'], //this is a builtIn validator
    maxLength:[40,'name must have less than or equal 40 letters']
    /*validate:[validator.isAlpha,'tour must only contain characters ']*/
  },
  slug:String,
  duration:{
    type:Number,
    required:[true,'tour must have a duration']
  },secretTour :{
    type:Boolean,
    default:false
    }
  ,
  maxGroupSize:{
    type:Number,
    required:[true,'tour must have a group size']
  },
  difficulty:{
    type:String,
    required:[true,'tour must have a difficulty'],
    enum:{
      values:['easy','medium','difficult'],
      message:'difficulty is neither :easy or medium or difficult'
    }
  },
  ratingsAverage:{
    type:Number,
    default:4.5,
    set:val=>Math.round(val*10)/10
    //that for every time set value for this attribute that function will execute to make 4.666 to 4.7
  },
  ratingsQuantity:{
    type:Number,
    default:0
  },
  rating:{
    type:Number,
    default:4.5,
    min:[1,'rating must be above 1.0'],
    max:[5,'rating must be below 5.0']
  },
  price:{
    type:Number,
    required:[true,'tour must have price']
  },
  priceDiscount:{
    type:Number,
    validate:{
      validator:function(val) {
        return val<this.price;
        /*
          it is a custom validator we make with myself to validate a prop
          this we use here work with new document created only don`t work with update document
        */
      },
      message:'Discount price ({VALUE}) should be below regular price '
    }
  },
  summary:{
    type:String,
    required:[true,'tour must have summary'],
    trim:true
  },
  description:{
    type:String,
    trim:true
  },
  imageCover:{
    type:String,
    required:[true,'tour must have a image cover'],
  },
  images:[String],
  createdAt:{
    type:Date,
    default:Date.now()  //make the CreatedAt = the real time of add tour
  },
  startDates:[Date], //mean the tour may have more than start date like it start and dec. and start again in april and again in july
  startLocation:{
     //GeoJSON
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number],
    address: String,
    description: String
  },locations:[   //ro create embedded document create array of object of this document
      {
        type:{
          type:String,
          default:'Point',
          enum:['Point']
        },
        coordinates:[Number],
        address:String,
        description:String,
        day:Number
      }
    ],
  // guides:Array    //TO EMBEDDED DOCUMENTS IN THIS DOCUMENT
  guides:[           //TO REFERENCE DOCUMENTS IN THIS DOCUMENT BY USE CHILD REFERENCE /create array of IDS of this documents
    {
      type:mongoose.Schema.ObjectId, //THAT MEAN THE TYPE IS OBJECT ID
      ref:'User'                     //THAT MEAN THAT REFER TO USER DOCUMENTS
    }
  ]
  },
  {
    toJSON:{ virtuals:true},
    toObject:{ virtuals:true}
    /*we use this two options to can show the virtual prop when get data and toJson
      that we use when data show in json format and toObject when data show in object format
     */
  })

tourSchema.index({price:1,ratingsAverage:-1});
tourSchema.index({slug:1});
tourSchema.index({ startLocation: '2dsphere' });
//2d sphere index if data describes real points

/*this is a virtual property don`t save in database ,but it will be show only when we get the
   data by get method by calculate this function and show the virtual prop and here we use
   normal function not arrow function because in normal function we can access ( this )
   and ( this ) refer to the object which we want , we cannot use this virtual prop in request
   query because it not save in database
 */
tourSchema.virtual('durationWeek').get(function()
{
  return this.duration / 7;
})

/*
this is a virtual populate to solve the problem of not use child reference which the parent not know
any information about its children  because he does not have array of ids of his child ,so we want
to populate reviews in tour , we not have access to the reviews in the tour because we use parent reference
so that we use virtual populate to solve this problem and pass in his option first the model we reference,
second the foreign key in the model which reference and third primary key of this document ,here we
populate reviews when we get tour ,so we pass Review then foreign key (tour) then primary key (_id) =>that is tour id
 */
tourSchema.virtual('reviews',{
  ref:'Review',
  foreignField:'tour',
  localField:'_id'
});

//DOCUMENTATION MIDDLEWARES
/*
this is documentation middlewares and that two types :
 pre : that happen before an event
 post :that happen after  an event

*that execute before save() and create() only don`t work with update

 this here refers to documentation
 it takes two parameters first the event ,second the function which went to execute after or before
 the event.
 */
tourSchema.pre('save',function(next) {
  this.slug=slugify(this.name,{lower:true});
  //slugify make that => name (Test tour) convert to (test-tour) put - between every word
  next();
})

//COMMENT REFERENCE TO DOCUMENTATION MIDDLEWARES
/*tourSchema.pre('save',function(next) {
  console.log('the document will print .....');
  next();
})

tourSchema.post('save',function(doc,next) {
  console.log(doc);
  next();
})*/

/*//TO EMBEDDED DOCUMENTS IN ANOTHER DOCUMENT
tourSchema.pre('save',async function(next) {
  const guidePromises=this.guides.map(async id=>await User.findById(id)  )
  //HERE WE TAKE ID OF USER IN GUIDES ARRAY IN BODY INPUT THEN AWAIT ALL USER BEFORE SAVE AND SAVE THEM IN GUIDES

  this.guides= await  Promise.all(guidePromises);
  next();
})*/

//QUERY MIDDLEWARES
/*
this refers to query after or before execute the event
/^find/ => is regular expression means any event start with find like find , findOne ,
           findById elc...
*/
/*tourSchema.pre(/^find/,function(next) {
  this.find({secretTour:{$ne:true}})
  //here means find all documents else documents with secretTour = true
  next()
})*/

tourSchema.pre(/^find/,function(next) {
  this.populate({
    path:'guides',
    select:'-__v -passwordChangedAt'
  })
  /*
  populate is used to replace the reference of some documents into the documents to be like than
  embedded documents in output only not in database in the database it will be like reference we path
  to it object with the path with we would to replace with the original docs and some options we want
  like here we don't want to show __v and passwordChangedAt
   */


  next()
})

/*tourSchema.post(/^find/,function(docs,next) {
  console.log(docs);
  next()
})*/
//NOTE :WHEN WE WILL USE QUERY MIDDLEWARE?
//first when we would to do operation to some query after or before execute
//second when we will to do same operation in a query in more than one function ,so we use query middleware to not duplicate code in more function


//AGGREGATION MIDDLEWARES
/*
this here refers to aggregation object ,
we went here to no show secret Tour when get tours
this.pipeline()=>return array of stages of the aggregation
then we use unshift() to add a stage in the first of the array
this stage wew use to don`t select the secret Tour
 */
/*tourSchema.pre('aggregate',function(next) {
  this.pipeline().unshift({$match:{secretTour: {$ne:true}}})
  next();
})*/

//To Create Model the doc needed to create
const Tour=mongoose.model('Tour',tourSchema)

module.exports=Tour;