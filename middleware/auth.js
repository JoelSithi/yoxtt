const jwt = require ('jsonwebtoken');
const config = require('config');

// Exporting middleware:
module.exports = function (req, res, next) {
  // Get token from header by using req.header, and we're looking at x-auth-token to send it in
  const token = req.header('x-auth-token');

  // Check if no token & route protected & using the middleware:
  if(!token) {
    return res.status(401).json({ msg: 'No token: authorization denied!'});
  }
  // If there is one token, verify it:
  try { // decode token through verify:
    const decoded = jwt.verify(token, config.get('jwtSecret'));

    // set request user to the user that's in the decoded token:
    req.user = decoded.user;
    next();
  } catch { // if token exists but not valid:
    res.status(401).json({ msg: 'Invalid Token!' });
  }
}