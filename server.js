const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )

const User = mongoose.model('User', new mongoose.Schema({
                              username: {
                                type: String, 
                                required: true,
                                unique: true
                              }
                            })),
      Exercise = mongoose.model('Exercise', new mongoose.Schema({
                              userId: { type: Number, required: true },
                              description: { type: String, required: true },
                              duration: { type: Number, required: true },
                              date: { type: Date, default: new Date() }
                            }));

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/exercise/log', (req, res) => {
  let {userId, from, to, limit} = req.query;
  if (!userId) return;
  
  let query = {
      userId: userId, 
    };
  
  if (from && to) {
    query['date'] = {};
  }

  Exercise.find(query)
    .limit(limit)
    .exec((err, data) => {
  
    if (err) throw err;
    
    
  });
});

app.post('/api/exercise/new-user', (req, res) => {

  if (!req.body.username) {
    return res.send('username is required!');
  }

  let user = new User({ username: req.body.username });
  user.save((err, data) => {
  
    if (err) throw err;
    res.status(201).json(data);
  });
  
});

app.post('/api/exercise/add', (req, res) => {

  if (!req.body.userId 
      || !req.body.description 
      || !req.body.duration) return;
  
  let exercise = new Exercise(
    { 
      userId: req.body.userId,
      description: req.body.description,
      duration: req.body.duration,
      date: req.body.date 
    });
  
  exercise.save((err, data) => {
  
    if (err) throw err;
    res.status(201).json(data);

  });
  
});


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
