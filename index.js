const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const { Schema } = mongoose;

mongoose.connect(process.env.MONGO_URI);//no longer accept callback function in the connect()

const userSchema = new Schema({
  username: String,
},
);
const User = mongoose.model('User', userSchema);

const exerciseSchema = new Schema({
  user_id: {
    type: String,
    requried: true
  },
  username: String,
  description: String,
  duration: Number,
  date: Date,
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({extended:true}));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', async (req, res) => {
  const users = await User.find({}).select("_id username");
  res.json(users);
})  

app.get('/api/users/:_id/logs', async (req, res) => {
  const id = req.params._id;
  const { from, to, limit } = req.query;
  const user = await User.findById(id);
  if(!user) {
    res.send("The user does not exist")
    return;
  }
  
  let dateData = {};
  if(from) {
    dateData["$gte"] = new Date(from)
  }
  if(to) {
    dateData["$lte"] = new Date(to)
  }
  let filter = {
    user_id: id
  }
  if(from || to) {
    filter.date = dateData;
  }
  const exerciseData = await Exercise.find(filter).limit(+limit ?? 500)

  const log = exerciseData.map((d) => ({
    description: d.description,
    duration: d.duration,
    date: d.date.toDateString(),
  }))

  res.json({
    username: user.username,
    count: exerciseData.length,
    _id: user.user_id,
    log,
  })
});


app.post('/api/users', async (req, res) => {
  const username = req.body.username;
  const user = await User.findOne({ username });
  try{
    if(!user) {
      const newUser = new User({
        username: username,
      })
      const user = await newUser.save();
      res.json(user);
    }
      res.json(user);
  }catch(error){
    console.log(error)
  }
});


app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id; 
  const { description, duration, date } = req.body;

  try{
    const user = await User.findById(id)
    if(!user) {
      res.send("The user does not exist")
    }else {
      const newExercise = new Exercise({ 
        user_id: user._id,
        username: user.username,
        description,
        duration, 
        date: date ? new Date(date) : new Date()
      })
      const exercise = await newExercise.save();
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString(),
      });
    }
    }catch(error){
      res.send("error occured to save the exercise");
      console.log(error);
    }
  });





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
