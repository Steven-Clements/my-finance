/* ~ ~ ~ ~ ~ ${ Import Dependencies } ~ ~ ~ ~ ~ */
const mongoose = require('mongoose');

/* ~ ~ ~ ~ ~ ${ Connect to MongoDB Atlas } ~ ~ ~ ~ ~ */
const connectDB = async () => {
  try {
    /* - - - - - < Attempt to Establish Connection /> - - - - - */
    const conn = await mongoose.connect(process.env.MONGO_URI);

    /* - - - - - < Log Successful Connections to Console /> - - - - - */
    console.log(
      `MongoDB Atlas connection to host ${conn.connection.host} was successful...`
    );
  } catch (error) {
    /* - - - - - < Log Error(s) to the Console /> - - - - - */
    console.log(error);

    /* - - - - - < Exit Process with Failure Code /> - - - - - */
    process.exit(1);
  }
}

/* ~ ~ ~ ~ ~ ${ Export the Connection Function } ~ ~ ~ ~ ~ */
module.exports = connectDB;