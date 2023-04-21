const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const { Schema } = mongoose;

mongoose.connect(process.env.MONGO_URI);

const userSchema = new Schema({
  username: String,
},
{versionKey: false}                             
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
},
{versionKey: false});

const Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));
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
 
  const findUser = await User.findById(id);
  if(!findUser) {
    res.send("The user does not exist")
  }
  const filter = {
    user_id: id, 
  }

  if (from || to) {
  const dateFilter = {
      '$gte': new Date(from),
      '$lte': new Date(to),
    }
  filter.date = dateFilter;
  }else{
    res.send("Please input dates to search");
  }
  
  
  const exerciseData = await Exercise.find(filter).limit(+limit ?? 50)

  const logArr = exerciseData.map((d) => ({
    description: d.description,
    duration: d.duration,
    date: d.date.toDateString(),
  }))

  res.json({
    username: findUser.username,
    count: exerciseData.length,
    _id: findUser.user_id,
    log: logArr
  })
});


app.post('/api/users', async (req, res) => {
  const username = req.body.username;
  const user = await User.findOne({ username });
  
    if (user) return res.json(user);
  
    const newUser = new User({
        username,
      })
    const saveUser = await newUser.save();
     res.json(saveUser)   
});


app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date ? new Date(req.body.date) : new Date();
  const findUser = await User.findById(id)
    if(findUser) {
      const newExercise = new Exercise({
        user_id: findUser._id,
        username: findUser.username,
        description,
        duration,
        date,
      })
      const exercise = await newExercise.save();
      res.json({
        _id: findUser._id,
        username: findUser.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString(),
      });
    }else {
      res.send("The user does not exist");
    }
    
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
