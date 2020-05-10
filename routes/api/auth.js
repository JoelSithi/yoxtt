const express = require('express');
const router = express.Router();
const auth = require ('../../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require ('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator/check');

const User = require ('../../models/User');
// User Route (@route: GET api/auth, @access: public), 
router.get('/', auth, async (req,res) =>  {
 try {
   const user = await User.findById(req.user.id).select('-password');
   res.json(user);
 } catch (err) {
  console.log(err.message);
  res.status(500).send('Server error');
 }
});

// Authentificate user & get token ( @route:  POST api/auth, @access: public)
router.post('/',[
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], 
 async (req,res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(400).json({ errors: errors.array() });
  }
  const {  email, password } = req.body;
  
  try {
    // See if user already exists:
    let user = await User.findOne({ email });
    if(!user){
      return res.status(400).json({ errors: [{ msg: 'Invalid Credentials'}] });
    }

    /* Compare password entered and encrypted password( which we can get form the user
    because we make request to the db to get the user ( line 35)):*/
    const isMatch = await bcrypt.compare(password, user.password);

    // check :
    if(!isMatch) {
      return res.status(400).json({ errors: [{ msg: 'Invalid Credentials'}] });
    }

    // Return jsonwebtoken:
    // 1) return the payload:
    const payload = {
      user: {
        id: user.id
      }
    };
    // 2) jwt sign:
    jwt.sign(payload, config.get('jwtSecret'),
    { expiresIn: 360000 },
    (err, token) => {
      if(err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server error');
  }
 
});

module.exports = router;