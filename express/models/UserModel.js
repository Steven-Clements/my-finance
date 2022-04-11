/* ~ ~ ~ ~ ~ ${ Import Dependencies } ~ ~ ~ ~ ~ */
const mongoose = require('mongoose');

/* ~ ~ ~ ~ ~ ${ Create a Model for the Resource } ~ ~ ~ ~ ~ */
const UserSchema = new mongoose.Schema({
  role: {
    type: String,
    default: 'member'
  },
  status: {
    type: String,
    default: 'unverified'
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  verification: {
    type: String,
  },
  recovery: {
    type: String
  },
  resetFlag: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  lastUpdated: {
    type: Date
  },
  created: {
    type: Date,
    default: Date.now
  }
});

/* ~ ~ ~ ~ ~ ${ Export the Model } ~ ~ ~ ~ ~ */
module.exports = User = mongoose.model('users', UserSchema);