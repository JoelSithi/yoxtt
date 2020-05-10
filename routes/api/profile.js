const express = require('express');
const router = express.Router();
const auth = require ('../../middleware/auth');
const { check, validationResult } = require('express-validator/check');

const Profile = require ('../../models/Profile');
const User = require ('../../models/User');
const Post = require('../../models/Post');

// Get current User profile route (@ route GET api/profile/me, @access: PRIVATE): 
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne( { user: req.user.id }).populate('user', ['name', 'avatar']);

    if(!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }

    res.json(profile)
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server Error');
  }
});

// Create or update user profile route (@ route POST api/profile, @access: PRIVATE): 
router.post('/',[ auth, [
  check('status', 'Status is required').not().isEmpty(),
  check('skills', 'Skills is required').not().isEmpty()
] ], async (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(400).json({ errors: errors.array()});
  }
 
  const {
    company,
    location,
    website,
    bio,
    skills,
    status,
    githubusername,
    youtube,
    twitter,
    instagram,
    linkedin,
    facebook
  } = req.body;
 
  // Build profile object:
  const profileFields = {};
  profileFields.user = req.user.id;
  if(company) profileFields.company = company;
  if(website) profileFields.website = website;
  if(location) profileFields.location = location;
  if(bio) profileFields.bio = bio;
  if(status) profileFields.status = status;
  if(githubusername) profileFields.githubusername = githubusername;
  if(skills) {
    profileFields.skills = skills.split(',').map(skill => skill.trim());
  }

  // Build social object:
  profileFields.social = {};
  if (youtube) profileFields.social.youtube = youtube;
  if (twitter) profileFields.social.twitter = twitter;
  if (facebook) profileFields.social.facebook = facebook;
  if (linkedin) profileFields.social.linkedin = linkedin;
  if (instagram) profileFields.social.instagram = instagram;
  
  try {
    let profile = await Profile.findOne({ user: req.user.id });

    if(profile){
      // Update:
      profile = await Profile.findOneAndUpdate({ user: req.user.id}, { $set:
      profileFields}, { new: true });

      return res.json(profile);
    }

    // Create:
    profile = new Profile(profileFields);

    await profile.save();
    res.json(profile);

  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server Error');
  }
});

// GET all profiles 's route (@ route GET api/profile, @access: Public): 
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server Error');
  }
});

// GET profile by user ID 's route (@ route GET api/profile/user/:user_id, @access: Public): 
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);

    if(!profile)  return res.status(400).json({ msg: ' No profile for this user ! '});

    res.json(profile);
  } catch (err) {
    console.log(err.message);
    if(err.kind == 'ObjectId') {
      return res.status(400).json({ msg: ' Profile not found! '});
    }
    res.status(500).send('Server Error');
  }
});

// DELETE profile, user & posts's route (@ route DELETE api/profile, @access: Private): 
router.delete('/', auth, async (req, res) => {
  try {
    // Remove user posts
    await Post.deleteMany({ user: req.user.id });

    // Remove Profile:
     await Profile.findOneAndRemove({ user: req.user.id });

    // Remove user:
     await User.findOneAndRemove({ _id: req.user.id });
     
     res.json({ msg: 'User Deleted! '});

  } catch (err) {
    console.log(err.message);
    
    res.status(500).send('Server Error');
  }
});

// ADD profile experience's route (@ route PUT api/profile/experience, @access: Private): 
router.put('/experience', [ auth, [ 
  check('title', 'Title is required').not().isEmpty(),
  check('company', 'Company is required').not().isEmpty(),
  check('from', 'From date is required').not().isEmpty()
 ] ], async (req, res) => {
  
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    };

    try {
      const profile = await Profile.findOne( { user: req.user.id });
      profile.experience.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.log(err.message);
     res.status(500).send('Server Error');
    }
  }
);

// DELETE experience from profile 's route (@ route DELETE api/profile/experience/:exp_id, @access: Private): 
router.delete('/experience/:exp_id',  auth, async (req, res) => {
  try {
    const profile = await Profile.findOne( { user: req.user.id });// getting profile of the logged in user
    // Get  the remove index:
    const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

    // Splice the remove index:
    profile.experience.splice(removeIndex, 1);

    // Saving it:
    await profile.save();

    // Sending back a response:
    res.json(profile);
  } catch (err) {
    console.log(err.message);
   res.status(500).send('Server Error');
  }
});

// ADD profile EDUCATION's route (@ route PUT api/profile/education, @access: Private): 
router.put('/education', [ auth, [ 
  check('school', 'School is required').not().isEmpty(),
  check('degree', 'Degree is required').not().isEmpty(),
  check('fieldofstudy', 'Field of study is required').not().isEmpty(),
  check('from', 'From date is required').not().isEmpty()
 ] ], async (req, res) => {
  
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    };

    try {
      const profile = await Profile.findOne( { user: req.user.id });
      profile.education.unshift(newEdu);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.log(err.message);
     res.status(500).send('Server Error');
    }
  }
);

// DELETE education from profile 's route (@ route DELETE api/profile/education/:edu_id, @access: Private): 
router.delete('/education/:edu_id',  auth, async (req, res) => {
  try {
    const profile = await Profile.findOne( { user: req.user.id });// getting profile of the logged in user
    // Get  the remove index:
    const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);

    // Splice the remove index:
    profile.education.splice(removeIndex, 1);

    // Saving it:
    await profile.save();

    // Sending back a response:
    res.json(profile);
  } catch (err) {
    console.log(err.message);
   res.status(500).send('Server Error');
  }
});

module.exports = router;