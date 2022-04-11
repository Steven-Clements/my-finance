/* ~ ~ ~ ~ ~ ${ Import Dependencies } ~ ~ ~ ~ ~ */
const express = require('express');
const { check, validationResult } = require('express-validator');
const User = require('../models/UserModel');
const speak = require('speakeasy');
const mailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

/* ~ ~ ~ ~ ~ ${ Initialize Express Router } ~ ~ ~ ~ ~ */
const router = express.Router();

/* ~ ~ ~ ~ ~ ${ POST | Public | Authenticate User } ~ ~ ~ ~ ~ */
router.post('/', [
  /* - - - - - < Check that Request Data is Valid /> - - - - - */
  check('email', 'Please provide a valid email address.').isEmail(),
  check('password', 'Please provide a valid password.').not().isEmpty()
], async (req, res) => {
  /* - - - - - < Perform Form Validation /> - - - - - */
  const errors = validationResult(req);

  /* - - - - - < Check for Validation Errors /> - - - - - */
  if (!errors.isEmpty()) {
    /* `,`,`, ( Return 400 Error Response )=> `,`,`, */
    return res.status(400).json({ errors: errors.array() });
  }

  /* - - - - - < Destructure from Request Data /> - - - - - */
  const { email, password } = req.body;

  try {
    /* `,`,`, ( Search Database for User )=> `,`,`, */
    const user = await User.findOne({ email });

    /* `,`,`, ( Check if User Exists )=> `,`,`, */
    if (!user) {
      /* ~ ~ ~ <? Return 401 Error Response ?> ~ ~ ~ */
      return res.status(401).json({ message: 'Invalid email address or password.' });
    }

    /* `,`,`, ( Check if User Status is Unverified )=> `,`,`, */
    if (user.status === 'unverified') {
      /* ~ ~ ~ <? Return 400 Error Response ?> ~ ~ ~ */
      return res.status(400).json({ message: 'Please verify your email address before logging in.' });
    }

    /* `,`,`, ( Check that User Status is Active )=> `,`,`, */
    if (user.status !== 'active') {
      /* ~ ~ ~ <? Return 400 Error Response ?> ~ ~ ~ */
      return res.status(400).json({ message: 'Account suspended. Contact an administrator for assistance...' });
    }

    /* `,`,`, ( Verify Password Entry )=> `,`,`, */
    const isMatch = await bcrypt.compare(password, user.password);

    /* `,`,`, ( Check for Authentication Errors )=> `,`,`, */
    if (!isMatch) {
      /* ~ ~ ~ <? Return 401 Error Response ?> ~ ~ ~ */
      return res.status(401).json({ message: 'Invalid email address or password.' });
    }

    /* `,`,`, ( Update User Data )=> `,`,`, */
    user.lastLogin = Date.now();

    /* `,`,`, ( Save Updated User )=> `,`,`, */
    await user.save();

    /* `,`,`, ( Create a New JWT Payload )=> `,`,`, */
    const payload = ({
      user: {
        id: user.id,
        role: user.role,
        reset: user.resetFlag
      }
    });

    /* `,`,`, ( Sign New JSON Web Token )=> `,`,`, */
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        return res.json(token);
      }
    );
  } catch (error) {
    /* `,`,`, ( Log Error(s) to the Console )=> `,`,`, */
    console.log(error);

    /* `,`,`, ( Return 500 Error Response )=> `,`,`, */
    return res.status(500).json({ message: 'An unexpected error occurred. Please try your request again later...' });
  }
});

/* ~ ~ ~ ~ ~ ${ POST | Public | Register New User } ~ ~ ~ ~ ~ */
router.post('/register', [
  /* - - - - - < Check that Request Data is Valid /> - - - - - */
  check('name', 'Please provide your first and last name.').not().isEmpty(),
  check('email', 'Please provide a valid email address.').isEmail(),
  check('password', 'Please provide a password with at least 7 characters.').not().isEmpty()
], async (req, res) => {
  /* - - - - - < Perform Form Validation /> - - - - - */
  const errors = validationResult(req);

  /* - - - - - < Check for Validation Errors /> - - - - - */
  if (!errors.isEmpty()) {
    /* `,`,`, ( Return 400 Error Response )=> `,`,`, */
    return res.status(400).json({ errors: errors.array() });
  }

  /* - - - - - < Destructure from Request Data /> - - - - - */
  const { name, email, password } = req.body;

  try {
    /* `,`,`, ( Search Database for User )=> `,`,`, */
    let user = await User.findOne({ email });

    /* `,`,`, ( Check if User Exists )=> `,`,`, */
    if (user) {
      /* ~ ~ ~ <? Return 400 Error Response ?> ~ ~ ~ */
      return res.status(400).json({ message: 'Email address is already in use.' });
    }

    /* `,`,`, ( Create a New User Object )=> `,`,`, */
    user = new User({
      name,
      email,
      password,
      verification: ''
    });

    /* `,`,`, ( Generate a Random Verification Code )=> `,`,`, */
    const code = speak.generateSecret();
    const verification = code.base32.substring(0, 8);

    /* `,`,`, ( Create a New Email Transporter )=> `,`,`, */
    const transporter = mailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    /* `,`,`, ( Attempt to Email Verification Code )=> `,`,`, */
    await transporter.sendMail({
      from: '"Clementine Solutions" <develop@clementine-solutions.com>',
      to: email,
      subject: "✔ Verify Your Email",
      text: verification,
      html: verification
    });

    /* `,`,`, ( Generate Salt for Secure Hashing )=> `,`,`, */
    const salt = await bcrypt.genSalt(11);

    /* `,`,`, ( Hash Password Entry & Verification Code )=> `,`,`, */
    user.password = await bcrypt.hash(password, salt);
    user.verification = await bcrypt.hash(verification, salt);

    /* `,`,`, ( Save User to the Database )=> `,`,`, */
    await user.save();

    /* `,`,`, ( Return Success Response )=> `,`,`, */
    return res.json({ message: 'Registration successful. Please check your email...' });
  } catch (error) {
    /* `,`,`, ( Log Error(s) to the Console )=> `,`,`, */
    console.log(error);

    /* `,`,`, ( Return 500 Error Response )=> `,`,`, */
    return res.status(500).json({ message: 'An unexpected error occurred. Please try your request again later...' });
  }
});

/* ~ ~ ~ ~ ~ ${ POST | Public | Verify User Email } ~ ~ ~ ~ ~ */
router.post('/verify', [
  /* - - - - - < Check that Request Data is Valid /> - - - - - */
  check('email', 'Please provide a valid email address.').isEmail(),
  check('verification', 'Please provide a valid verification code.').not().isEmpty()
], async (req, res) => {
  /* - - - - - < Perform Form Validation /> - - - - - */
  const errors = validationResult(req);

  /* - - - - - < Check for Validation Errors /> - - - - - */
  if (!errors.isEmpty()) {
    /* `,`,`, ( Return 400 Error Response )=> `,`,`, */
    return res.status(400).json({ errors: errors.array() });
  }

  /* - - - - - < Destructure from Request Data /> - - - - - */
  const { email, verification } = req.body;

  try {
    /* `,`,`, ( Search Database for User )=> `,`,`, */
    const user = await User.findOne({ email });

    /* `,`,`, ( Check if User Exists )=> `,`,`, */
    if (!user) {
      /* ~ ~ ~ <? Return 401 Error Response ?> ~ ~ ~ */
      return res.status(401).json({ message: 'Invalid email address or verification code.' });
    }

    /* `,`,`, ( Check that User Status is Unverified )=> `,`,`, */
    if (user.status !== 'unverified') {
      /* ~ ~ ~ <? Return 400 Error Response ?> ~ ~ ~ */
      return res.status(400).json({ message: 'Email address has already been verified.' });
    }

    /* `,`,`, ( Verify Verification Code Entry )=> `,`,`, */
    const isMatch = await bcrypt.compare(verification, user.verification);

    /* `,`,`, ( Check for Authentication Errors )=> `,`,`, */
    if (!isMatch) {
      /* ~ ~ ~ <? Return 401 Error Response ?> ~ ~ ~ */
      return res.status(401).json({ message: 'Invalid email address or verification code.' });
    }

    /* `,`,`, ( Update User Data )=> `,`,`, */
    user.verification = null;
    user.status = 'active';
    user.lastLogin = Date.now();

    /* `,`,`, ( Save the Updated User )=> `,`,`, */
    await user.save();

    /* `,`,`, ( Create a New JWT Payload )=> `,`,`, */
    const payload = ({
      user: {
        id: user.id,
        role: user.role,
        reset: user.resetFlag
      }
    });

    /* `,`,`, ( Sign New JSON Web Token )=> `,`,`, */
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        return res.json(token);
      }
    );
  } catch (error) {
    /* `,`,`, ( Log Error(s) to the Console )=> `,`,`, */
    console.log(error);

    /* `,`,`, ( Return 500 Error Response )=> `,`,`, */
    return res.status(500).json({ message: 'An unexpected error occurred. Please try your request again later...' });
  }
});

/* ~ ~ ~ ~ ~ ${ POST | Public | Request User Recovery } ~ ~ ~ ~ ~ */
router.post('/forgot', [
  /* - - - - - < Check that Request Data is Valid /> - - - - - */
  check('email', 'Please provide a valid email address.').isEmail(),
], async (req, res) => {
  /* - - - - - < Perform Form Validation /> - - - - - */
  const errors = validationResult(req);

  /* - - - - - < Check for Validation Errors /> - - - - - */
  if (!errors.isEmpty()) {
    /* `,`,`, ( Return 400 Error Response )=> `,`,`, */
    return res.status(400).json({ errors: errors.array() });
  }

  /* - - - - - < Destructure from Request Data /> - - - - - */
  const { email } = req.body;

  try {
    /* `,`,`, ( Search Database for User )=> `,`,`, */
    const user = await User.findOne({ email });

    /* `,`,`, ( Check That User Exists )=> `,`,`, */
    if (!user) {
      /* ~ ~ ~ <? Return 400 Error Response ?> ~ ~ ~ */
      return res.json({ message: 'An account recovery code has been sent to your email.' });
    }

    /* `,`,`, ( Generate a Random Recovery Code )=> `,`,`, */
    const code = speak.generateSecret();
    const recovery = code.base32.substring(0, 8);

    /* `,`,`, ( Create a New Email Transporter )=> `,`,`, */
    const transporter = mailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    /* `,`,`, ( Attempt to Email Recovery Code )=> `,`,`, */
    await transporter.sendMail({
      from: '"Clementine Solutions" <develop@clementine-solutions.com>',
      to: email,
      subject: "✔ Account Recovery",
      text: recovery,
      html: recovery
    });

    /* `,`,`, ( Generate Salt for Secure Hashing )=> `,`,`, */
    const salt = await bcrypt.genSalt(11);

    /* `,`,`, ( Hash Recovery Code )=> `,`,`, */
    user.recovery = await bcrypt.hash(recovery, salt);

    /* `,`,`, ( Save User to the Database )=> `,`,`, */
    await user.save();

    /* `,`,`, ( Return Success Response )=> `,`,`, */
    return res.json({ message: 'An account recovery code has been sent to your email.' });
  } catch (error) {
    /* `,`,`, ( Log Error(s) to the Console )=> `,`,`, */
    console.log(error);

    /* `,`,`, ( Return 500 Error Response )=> `,`,`, */
    return res.status(500).json({ message: 'An unexpected error occurred. Please try your request again later...' });
  }
});

/* ~ ~ ~ ~ ~ ${ POST | Public | Verify User Recovery } ~ ~ ~ ~ ~ */
router.post('/recovery', [
  /* - - - - - < Check that Request Data is Valid /> - - - - - */
  check('email', 'Please provide a valid email address.').isEmail(),
  check('recovery', 'Please provide a valid recovery code.').not().isEmpty()
], async (req, res) => {
  /* - - - - - < Perform Form Validation /> - - - - - */
  const errors = validationResult(req);

  /* - - - - - < Check for Validation Errors /> - - - - - */
  if (!errors.isEmpty()) {
    /* `,`,`, ( Return 400 Error Response )=> `,`,`, */
    return res.status(400).json({ errors: errors.array() });
  }

  /* - - - - - < Destructure from Request Data /> - - - - - */
  const { email, recovery } = req.body;

  try {
    /* `,`,`, ( Search Database for User )=> `,`,`, */
    const user = await User.findOne({ email });

    /* `,`,`, ( Check if User Exists )=> `,`,`, */
    if (!user) {
      /* ~ ~ ~ <? Return 401 Error Response ?> ~ ~ ~ */
      return res.status(401).json({ message: 'Invalid email address or recovery code.' });
    }

    /* `,`,`, ( Check that User Status is Active )=> `,`,`, */
    if (user.status !== 'active') {
      /* ~ ~ ~ <? Return 400 Error Response ?> ~ ~ ~ */
      return res.status(400).json({ message: 'Account is unverified or suspended. Cannot perform account recovery...' });
    }

    /* `,`,`, ( Verify Recovery Code Entry )=> `,`,`, */
    const isMatch = await bcrypt.compare(recovery, user.recovery);

    /* `,`,`, ( Check for Authentication Errors )=> `,`,`, */
    if (!isMatch) {
      /* ~ ~ ~ <? Return 401 Error Response ?> ~ ~ ~ */
      return res.status(401).json({ message: 'Invalid email address or recovery code.' });
    }

    /* `,`,`, ( Update User Data )=> `,`,`, */
    user.password = user.recovery;
    user.recovery = null;
    user.resetFlag = true;
    user.lastLogin = Date.now();

    /* `,`,`, ( Save the Updated User )=> `,`,`, */
    await user.save();

    /* `,`,`, ( Create a New JWT Payload )=> `,`,`, */
    const payload = ({
      user: {
        id: user.id,
        role: user.role,
        reset: user.resetFlag
      }
    });

    /* `,`,`, ( Sign New JSON Web Token )=> `,`,`, */
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        return res.json(token);
      }
    );
  } catch (error) {
    /* `,`,`, ( Log Error(s) to the Console )=> `,`,`, */
    console.log(error);

    /* `,`,`, ( Return 500 Error Response )=> `,`,`, */
    return res.status(500).json({ message: 'An unexpected error occurred. Please try your request again later...' });
  }
});

/* ~ ~ ~ ~ ~ ${ POST | Private | Get Logged In User } ~ ~ ~ ~ ~ */
router.get('/', auth, async (req, res) => {
  try {
    /* - - - - - < Search Database for User /> - - - - - */
    const user = await User.findById(req.user.id).select('-password').select('-verification').select('-recovery').select('-resetFlag').select('-status');

    /* - - - - - < Check that User Exists /> - - - - - */
    if (!user) {
      /* ~ ~ ~ <? Return 401 Error Response ?> ~ ~ ~ */
      return res.status(401).json({ message: 'No Users Found...' });
    }

    /* - - - - - < Return User Data /> - - - - - */
    return res.json(user);
  } catch (error) {
    /* `,`,`, ( Log Error(s) to the Console )=> `,`,`, */
    console.log(error);

    /* `,`,`, ( Return 500 Error Response )=> `,`,`, */
    return res.status(500).json({ message: 'An unexpected error occurred. Please try your request again later...' });
  }
});

/* ~ ~ ~ ~ ~ ${ PUT | Private | Update User Name } ~ ~ ~ ~ ~ */
router.put('/', auth, [
  /* - - - - - < Check that Request Data is Valid /> - - - - - */
  check('name', 'Please provide your first and last name.').not().isEmpty(),
], async (req, res) => {
  /* - - - - - < Perform Form Validation /> - - - - - */
  const errors = validationResult(req);

  /* - - - - - < Check for Validation Errors /> - - - - - */
  if (!errors.isEmpty()) {
    /* `,`,`, ( Return 400 Error Response )=> `,`,`, */
    return res.status(400).json({ errors: errors.array() });
  }

  /* - - - - - < Destructure from Request Data /> - - - - - */
  const { name } = req.body;

  try {
    /* - - - - - < Search Database for User /> - - - - - */
    const user = await User.findById(req.user.id).select('-password').select('-verification').select('-recovery').select('-status').select('-resetFlag');

    /* - - - - - < Check that User Exists /> - - - - - */
    if (!user) {
      /* ~ ~ ~ <? Return 401 Error Response ?> ~ ~ ~ */
      return res.status(401).json({ message: 'No Users Found...' });
    }

    /* - - - - - < Update User Name /> - - - - - */
    user.name = name;

    /* - - - - - < Save Updated User /> - - - - - */
    await user.save();

    /* - - - - - < Return User Data /> - - - - - */
    return res.json(user);
  } catch (error) {
    /* `,`,`, ( Log Error(s) to the Console )=> `,`,`, */
    console.log(error);

    /* `,`,`, ( Return 500 Error Response )=> `,`,`, */
    return res.status(500).json({ message: 'An unexpected error occurred. Please try your request again later...' });
  }
});

/* ~ ~ ~ ~ ~ ${ PUT | Private | Update User Password } ~ ~ ~ ~ ~ */
router.put('/secure', auth, [
  /* - - - - - < Check that Request Data is Valid /> - - - - - */
  check('password', 'Please provide your current password.').not().isEmpty(),
  check('newpassword', 'Please create a new password with at least 7 characters.').not().isEmpty()
], async (req, res) => {
  /* - - - - - < Perform Form Validation /> - - - - - */
  const errors = validationResult(req);

  /* - - - - - < Check for Validation Errors /> - - - - - */
  if (!errors.isEmpty()) {
    /* `,`,`, ( Return 400 Error Response )=> `,`,`, */
    return res.status(400).json({ errors: errors.array() });
  }

  /* - - - - - < Destructure from Request Data /> - - - - - */
  const { password, newpassword } = req.body;

  try {
    /* - - - - - < Search Database for User /> - - - - - */
    const user = await User.findById(req.user.id).select('-verification').select('-recovery').select('-status').select('-resetFlag');

    /* - - - - - < Check that User Exists /> - - - - - */
    if (!user) {
      /* ~ ~ ~ <? Return 401 Error Response ?> ~ ~ ~ */
      return res.status(401).json({ message: 'No Users Found...' });
    }

    if (user.resetFlag === true) {
      /* - - - - - < Generate Salt for Secure Hashing /> - - - - - */
      const salt = await bcrypt.genSalt(11);

      /* - - - - - < Update User Password /> - - - - - */
      user.resetFlag = false;
      user.password = await bcrypt.hash(newpassword, salt);

      /* - - - - - < Save Updated User /> - - - - - */
      await user.save();

      /* - - - - - < Return Success Message /> - - - - - */
      return res.json({ message: 'Password Updated Successfully.' });
    } else {
      /* - - - - - < Verify User Password Entry /> - - - - - */
      const isMatch = await bcrypt.compare(password, user.password);

      /* - - - - - < Check for Authentication Errors /> - - - - - */
      if (!isMatch) {
        /* ~ ~ ~ <? Return 401 Error Response ?> ~ ~ ~ */
        return res.status(401).json({ message: 'Invalid password was provided.' });
      }

      /* - - - - - < Generate Salt for Secure Hashing /> - - - - - */
      const salt = await bcrypt.genSalt(11);

      /* - - - - - < Update User Password /> - - - - - */
      user.password = await bcrypt.hash(newpassword, salt);

      /* - - - - - < Save Updated User /> - - - - - */
      await user.save();

      /* - - - - - < Return Success Message /> - - - - - */
      return res.json({ message: 'Password Updated Successfully.' });
    }
  } catch (error) {
    /* `,`,`, ( Log Error(s) to the Console )=> `,`,`, */
    console.log(error);

    /* `,`,`, ( Return 500 Error Response )=> `,`,`, */
    return res.status(500).json({ message: 'An unexpected error occurred. Please try your request again later...' });
  }
});

/* ~ ~ ~ ~ ~ ${ Export the Router } ~ ~ ~ ~ ~ */
module.exports = router;