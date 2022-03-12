const mongoose=require('mongoose')
const validator=require('validator')
const bcrypt=require('bcryptjs');
const crypto=require('crypto');

const userSchema =new mongoose.Schema({
  name:{
    type:String,
    required:[true,'user must has a name'],
  },
  role:{
    type:String,
    enum:['user','guide','guide-lead','admin'],
    default:'user'
  },
  email:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    validate:[validator.isEmail,'Please provide a valid email']
  },
  photo:{
    type:String,
    default: 'default.jpg'
  },
  password:{
    type:String,
    required:[true,'Please provide a password'],
    minLength:8,
    select :false //means not to show password at any output to be secure
  },
  active:{
   type:Boolean,
   default:true,
   select:false
  },
  passwordConfirm:{
    type:String,
    required:[true,'Please confirm tour password'],
    validate:{
      validator:function(vl){
        return vl===this.password;
        /*
        we use normal function here not arrow to can access ( this ) and ( this ) work only
        in create and save and don't work in update ,so when we want to update we must use save
        to access this to make this validator to check if pass == confirm pass
         */
      },
      message:'passwords are not the same'
    }
  },
  passwordChangedAt:{ //to save time of change password
   type: Date
  },
  passwordResetToken:String,
  passwordResetExpires:Date
})
//TO ENCRYPT PASSWORD USING DOCUMENTATION MIDDLEWARE
//it's actually working after get data and before saving data
userSchema.pre('save',async function(next){
  if(!this.isModified('password')) return next();
  //check if the password not updated return next and go to next middleware because timely we want to update same date not update password
  //if password updated or created go to encrypted password

  this.password=await bcrypt.hash(this.password,12);
  this.passwordConfirm=undefined;
})

//TO UPDATE changedPasswordAt PROPERTY FOR USER
userSchema.pre('save',function(next) {
  if(!this.isModified('password') || this.isNew) return next();
  //if the password not changed and the document is new just created that mean that we don't to update changedPasswordAt
  //if password only changed that mean in this case we want to update changedPasswordAt

  this.changedPasswordAt=Date.now()-1000;
  /*
   here happen problem what that ? saving data in Database may be slower than the token issue that mean the token
   will create before the changedPasswordAt changed and saved in database and that make this token invalid
   so we minus 1 second from that like we do here to be changedPasswordAt be before the token issue
   */

  next();
})

userSchema.pre(/^find/,function(next){
  this.find({active:{$ne:false}});
  next();
})

//TO CHECK IF ENCRYPTED PASSWORD IS EQUAL TO THE ENTERED USER PASSWORD
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
  //we use async await here because bcrypt is sync function , it will be block event loop ,so we use async to change to async function
};
/*
the previous function is called instance function it will work to all documents in the same collection
it will be like that if we get document from database like => user =User.find() ,
you can use this function like method for this document it will be like that user.correctPassword()
*/

//TO COMPARE BETWEEN THE TIME OF CHANGED PASSWORD AND THE TIME OF ISSUE THE TOKEN
//this function we pass to it the time of issued token
userSchema.methods.changedPasswordAfter=function(JWTTimeStamp){
  if(this.passwordChangedAt) //if the password changed
  {
    const changedTimeStamp=parseInt(this.passwordChangedAt.getTime() / 1000 , 10)
    //this to convert passwordChangedAt to the same sample of JWTTimeStamp to can compare between them
    return JWTTimeStamp < changedTimeStamp;
    //then compare if time of token is less than Changed password that mean the password changed after token
  }
  return false;
}

userSchema.methods.createPasswordResetToken=function(){
  const resetToken=crypto.randomBytes(32).toString('hex');
   //we make reset token which we will send with email to the user
  this.passwordResetToken= crypto.createHash('sha256').update(resetToken).digest('hex');
   /*and here we will encrypt the token and save in database to use it later to compare with the token
    which the user input to reset his password*/
  this.passwordResetExpires=Date.now() + 10 * 60 *1000;
  //we make expire time to this token to be valid 10 min only after created and then be expired

  return resetToken;
}

const User =mongoose.model('User',userSchema);

module.exports=User;