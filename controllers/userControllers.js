const User=require('./../models/userModel');
const apiError=require('./../utils/apiError');
const factory=require('./factoryHandlers');
const multer = require('multer');
const sharp = require('sharp');


//make the dist storage which the place where the photo save and set name for image
/*const multerStorage=multer.diskStorage({
  destination:(req,file,cb)=>{
    cb(null,'public/img/users');
  },
  filename:(req,file,cb)=>{
    //mimetype: image/jpg
    //image name will be that user-651651651-23216516-jpg
    //user-userid-timeWhenCreated-extension
    const ext=file.mimetype.split('/')[1];
    cb(null,`user-${req.user.id}-${Date.now()}.${ext}`);
  }
})*/

const multerStorage=multer.memoryStorage();
//to save image in memory in a buffer

//to check file entered and sure that this file is an image
const multerFilter=(req,file,cb)=>{
  if(file.mimetype.startsWith('image')){
    cb(null,true);
    //if image send first null that mean no error and then send true
  }else
  {
    cb(new apiError('Not an image! Please upload only images.',400),false);
    //if not image send first the error  and then send false
  }
}

const upload=multer({
  storage:multerStorage,
  fileFilter:multerFilter
})
//we use it to make the user to upload his photo into the application
//and pass option storage which the place where the photo save and if not pass this option the photo will save in memory and deleted later
//than we use the link of photo and save this link into DB
//and pass option file filter to check the entered file is an image

//to update user photo
exports.uploadUserPhoto=upload.single('photo');

//resize user photo to be square
exports.resizeUserPhoto=async (req,res,next)=>{
  if(!req.file) return next();
  //if not image go to next middleware

req.file.filename=`user-${req.user.id}-${Date.now()}.jpeg`;
//we define here name of the file because when save image in memory the name of file not be defined
//we define the name of file here because we will use it

await sharp(req.file.buffer)         //buffer where the photo save
  .resize(500,500) //to resize to be 500 * 500
  .toFormat('jpeg')     //to make extension of image jpeg
  .jpeg({quality:90})   //to compress the quality to decrease size of it
  .toFile(`public/img/users/${req.file.filename}`)  //to save the photo to the disk

  next();
}


const filterObj=(obj,...allowedFields)=>{  //it takes body of request and the fields to you want to filter
  const newObj={};
  Object.keys(obj).forEach(el =>{ //here we loop for all fields of this obj
    if(allowedFields.includes(el))
      newObj[el]=obj[el];
  })
  return newObj;
}


exports.updateMe=async (req,res)=>{
  //1)Create error if user Post password Data
    if(req.body.password||req.body.passwordConfirm){
     throw new apiError('This route is not for password updates. please use /updateMyPassword',400);
    }

  //2)Filtered out unwanted fields names that are not allow to be updated
  const filteredBody= filterObj(req.body,'name','email');
    //filter fields you access user to update because he may send in body role , he can't update his role from user to admin
  if(req.file) filteredBody.photo=req.file.filename;
    //if the user updated his photo it comes in req.file , we add it to filteredBody to updated

 //3) Update User Document
    const updatedUser=await User.findByIdAndUpdate(req.user.id,filteredBody,{new:true ,runValidators :true})
     //here we use update not save because save run all validators of all fields
     //but update run validator of the fields that user want to update only
    res.status(200).json({
      status:'success',
      data :{
        updatedUser
      }
    })
}

//DELETE THE CURRENT USER BY MAKE HIM INACTIVE NOT DELETED IN DATABASE
exports.deleteMe=async (req,res)=>{
  await User.findByIdAndUpdate(req.user.id,{active :false});

  res.status(204).json({
    data:null
  })
}
exports.PostUser=((req,res)=>
{
  res.status(500).json({
    status:'fail',
    message:'the route is not yet define'
  })
})

//we make this middleware to get data about current user by pass user id to params id to use it in getOne to get this user data
exports.getMe=(req,res,next)=>{
  req.params.id=req.user.id;
  next();
}

exports.getAllUsers=factory.getAll(User);

exports.patchUser=factory.updateOne(User);

exports.getUser=factory.getOne(User);

exports.deleteUser=factory.deleteOne(User);
