const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');
const auth = require ('../../middleware/auth');

const Post = require ('../../models/Post');
const Profile = require ('../../models/Profile');
const User = require ('../../models/User');


// Create a Post Route (@ route POST api/posts, @access: PRIVATE)     //res.send('Posts route'));
router.post('/', [ auth , [
  check('text', 'Text is required').not().isEmpty()
] ] , async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });

      const post = await newPost.save();

      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  } 
);  

// GET all Posts Route (@ route GET api/posts, @access: PRIVATE):
router.get('/', auth, async (req, res) => {
  try {
   const posts = await Post.find().sort({ date: -1 });

   res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET Post by ID's Route (@ route GET api/posts/:id, @access: PRIVATE):
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if(!post) {
      return res.status(404).json({ msg: 'Post not found '});
    }

    res.json(post);
  } catch (err) {
    console.error(err.message);

    if(err.name === 'CastError') {
      return res.status(404).json({ msg: 'Post not found '});
    }
    res.status(500).send('Server Error');
  }
});

// DELETE a Post's Route (@ route DELETE api/posts/:id, @access: PRIVATE):
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check post:
    if(!post) {
      return res.status(404).json({ msg: 'Post not found '});
    }

    // Check user:
    if(post.user.toString() !== req.user.id) {// post.user is an ObjectId vs req.user.id(= the logged in user) is a string, so we need to use toString()
      return res.status(401).json({ msg: 'User not authorized '});
    }
    await post.remove();

    res.json({ msg: 'Post removed!' });
  } catch (err) {
    console.error(err.message); 

    if(err.name === 'CastError') {
      return res.status(404).json({ msg: 'Post not found '});
    }
    res.status(500).send('Server Error');
  }
});

// LIKE a Post's Route (@ route PUT api/posts/like/:id, @access: PRIVATE):
router.put('/like/:id', auth, async( req, res) => {
  try {
    const post = await Post.findById(req.params.id);
 
    // Check if post has already been liked:
    if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
      return res.status(400).json({ msg: 'Post already liked' });
    }
    post.likes.unshift({ user: req.user.id });// unshift() push to the beginning

    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message); 
    res.status(500).send('Server Error');
  }
});

// UNLIKE a Post's Route (@ route PUT api/posts/unlike/:id, @access: PRIVATE):
router.put('/unlike/:id', auth, async( req, res) => {
  try {
    const post = await Post.findById(req.params.id);
 
    // Check if post has already been liked:
    if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
      return res.status(400).json({ msg: 'Post has not yet been liked' });
    }
    // get remove index:
    const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);

    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message); 
    res.status(500).send('Server Error');
  }
});

// COMMENT a Post Route (@ route POST api/posts/comment/:id, @access: PRIVATE)     //res.send('Posts route'));
router.post('/comment/:id', [ auth , [
  check('text', 'Text is required').not().isEmpty()
] ] , async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.id);

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      };

      post.comments.unshift(newComment);

      await post.save();

      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  } 
);  

// DELETE comment's Route (@ route POST api/posts/comment/:id/:comment_id, @access: PRIVATE) 
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Get comment from the post:
    const comment = post.comments.find(comment => comment.id === req.params.comment_id);

    // Make sure comment exists:
    if(!comment) {
      return res.status(404).json({ msg: 'Comment does not exist' });
    }

    //Check user:
    if(comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // get remove index:
    const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);
    post.comments.splice(removeIndex, 1);

    await post.save();
    res.json(post.comments);

  } catch (err) {
    
  }
})
module.exports = router;