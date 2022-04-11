/* ~ ~ ~ ~ ~ ${ Import Dependencies } ~ ~ ~ ~ ~ */
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./mongoDB/mongoose');

/* ~ ~ ~ ~ ~ ${ Initialize Server Assets } ~ ~ ~ ~ ~ */
const app = express();
dotenv.config();
connectDB();

/* ~ ~ ~ ~ ~ ${ Accept JSON Encoded Data } ~ ~ ~ ~ ~ */
app.use(express.json({ extended: false }));

/* ~ ~ ~ ~ ~ ${ Define API Routes } ~ ~ ~ ~ ~ */
app.use('/api/users', require('./routes/UserRoutes'));

/* ~ ~ ~ ~ ~ ${ Assign a Port for API Requests } ~ ~ ~ ~ ~ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(
  `Express server started in ${process.env.NODE_ENV} mode on port ${process.env.PORT}...`
));