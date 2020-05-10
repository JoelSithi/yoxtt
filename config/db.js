//MongoDB connection:
const moogoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const connectDB = async () => {
  try{
    await moogoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    });
    console.log('MongoDB Connected ...');
    
  } catch(err) {
    console.log(err.message);
    // Exit process with failure:
    process.exit(1)
  }
};

module.exports = connectDB;