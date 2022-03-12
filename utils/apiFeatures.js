/*
we make this class to include all features which we will use in every end point like sort ot limitingFields
we pass to the constructor of this class two things :
first :query =>query this is query we will do features on it
second :req.query =>queryString this is included the features in request we want like sort or page
*/
class apiFeatures{
  constructor(query,queryString) {
    this.query=query;
    this.queryString=queryString
  }

  filter()
  {
    //1A)Filtering
    const queryObject ={...this.queryString} //use this syntax we can make deep copy to create object from req.query to queryObject
    const excludedFields=['limit','sort','page','fields']
    excludedFields.forEach(el=> delete queryObject[el])
    //here we delete excludedFields from queryObject like this


    //1B)Advanced filtering

    //{difficulty:'easy',duration : { $gte:5 }} that is option we must write in find
    //{difficulty:'easy',duration : { gte:5 }}  that which come from queryObject from postman
    //we want to convert the second one to the first
    let queryStr=JSON.stringify(queryObject);
    queryStr=queryStr.replace(/\b(gte|gt|lte|lt|ste|st)\b/g,match=>`$${match}`)
    /* the inside  replace is regular expression that we used to convert this words to dollar sign
       before it ,( \b ) we use it choose this word not words includes this word,
       ( g ) we use it if the sentence contain more than one word
     */

    /*Note : Find() and any methods like it => that will return Query and
             if when we use await query change to the documents that we need ,
             this query which we use when we want to use query.prototype.methods
     */
    this.query=this.query.find(JSON.parse(queryStr));
    /* we make query here because we make this query in more than methods another
       filter like sort or limit and if we used await query that return from find() will
       change to document ,and we can not use it to do another queries
     */

    //Another Two ways to filter :
    //FIRST EASY FILTER WE PASS QUERY-OBJECT TO METHOD FIND AND THAN IT FILTER WITH THIS QUERIES
    //SECOND WAY WE USE QUERY.PROTOTYPE.METHODS
    /*
      const tours=await Tour.find()
                             .where('difficulty')
                             .equals('easy')
                             .where('duration')
                             .equals(5)
    */

    return this;
  }

  sort()
  {
    //2)SORTING
    if(this.queryString.sort)
    {
      //if we have two doc with the same value of the sort variable we sort again with second var.
      //sort(price,ratingsAverage) that come from postman like this
      //sort(price ratingsAverage) it should be like this
      const sortedBy=this.queryString.sort.split(',').join(' ');//=> return an array of results
      this.query=this.query.sort(sortedBy);
    }else{
      this.query=this.query.sort('-createdAt')
    }
    return this;
  }

  limitingFields()
  {
    //3)LIMITING FIELDS
    if(this.queryString.fields)
    {
      //if the user want to show some fields only and other NO
      //select(price,ratingsAverage,name) that come from postman like this
      //select(price ratingsAverage name) it should be like this
      const fields=this.queryString.fields.split(',').join(' ');
      this.query=this.query.select(fields)
    }
    else
    {
      this.query=this.query.select('-__v');
      //that mean not show __v
    }
    return this;
  }
  paginate()
  {
    //4)Pagination
    const page=this.queryString.page * 1|| 1;
    //we multiply *1 to convert page from string to Number , (|| 1) mean if not page in query take default value 1
    const limit=this.queryString.limit *1 || 100;
    const skip=(page - 1)*limit;
    //from 1 => 10 page1,from 11 => 20 page2,from 21 => 30 page3
    //query=query.skip(20).limit(10)

    this.query=this.query.skip(skip).limit(limit)
    return this;
  }
}

module.exports=apiFeatures;