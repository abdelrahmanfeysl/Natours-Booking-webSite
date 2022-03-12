/**************************every thing about server like database configuration***************************************/
const mongoose=require('mongoose')
const dotenv = require('dotenv');//that for environment variables

//to handle uncaught exception like syntax error and that must write in the first of the app
process.on('uncaughtException',err=>{
  console.log(err.name,err.message);
  console.log(err.stack);
  console.log('UNCAUGHT EXCEPTION! SHUTTING DOWN... ');
  process.exit(1);

})
dotenv.config({path:`${__dirname}/config.env`});
//we make that here before require app because read config.env before require app to avoid err
const app=require('./app');
//console.log(process.env);
//the last line to print all environment variable
//const DB=process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);
//the last line to connect to cloud database not local database

mongoose.connect(process.env.DATABASE_LOCAL).then(con=> console.log('connection is success'))
//connect to local database

const port=process.env.PORT || 8000;
const server=app.listen(port, () => {
  console.log('welcome from the server');
});

//handled unhandledRejection promises like failed connect to database
process.on('unhandledRejection',err=>
{
  console.log(err.name,err.message);
  console.log('UNHANDLED REJECTED! SHUTTING DOWN... ');
  server.close(()=> { //close server first to handle and finish all request pending then shot down process
    process.exit(1);
  })
})



