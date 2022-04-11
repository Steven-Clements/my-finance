/* ~ ~ ~ ~ ~ { Import Dependencies } ~ ~ ~ ~ ~ */
const jwt = require('jsonwebtoken');

/* ~ ~ ~ ~ ~ { Authenticate JSON Web Tokens } ~ ~ ~ ~ ~ */
module.exports = function(req, res, next) {
  
  /* - - - - - < Check that Token Exists /> - - - - - */
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({msg: 'No Token Found... Authentication Failed'});
  }
  
  /* - - - - - < Attempt to Decode Token /> - - - - - */
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (error) {
    /* - - - - - < Return 401 Error Message /> - - - - - */
    return res.status(401).json({ message: 'Invalid Token... Authentication Failed.' });
  }
}