const mongoose = require("mongoose");
const Post = mongoose.model("Post");
// for upload file handling
const multer = require("multer");
const jimp = require("jimp");

const imageUploadOptions = {
  storage: multer.memoryStorage(),
  limits: {
    // files upto 1 mb
    fileSize: 1024 * 1024 * 1,
  },
  fileFilter: (req, file, next) => {
    // only allow image files
    if (file.mimetype.startsWith("image/")) {
      // next(args,moveToNextMiddlerware)
      next(null, true);
    } else {
      next(null, false);
    }
  },
};

// get the file from req.body with key image and add it to req
exports.uploadImage = multer(imageUploadOptions).single("image");

exports.resizeImage = async (req, res, next) => {
  // if there is no file
  if (!req.file) {
    return next();
  }

  // if file is added in to req by multer
  const extension = req.file.mimetype.split("/")[1];
  req.body.image = `/static/uploads/${
    req.user.name
  }-${Date.now()}.${extension}`;
  // read the imagee
  const image = await jimp.read(req.file.buffer);
  // resizing the image. setting the width to AUTO so not to stretch out
  await image.resize(750, jimp.AUTO);
  // writing the image
  await image.write(`./${req.body.image}`);
  next();
};

exports.addPost = async (req, res) => {
  req.body.postedBy = req.user._id;
  const post = await new Post(req.body).save();
  await Post.populate(post, {
    path: "postedBy",
    select: "_id name avatar",
  });
  res.json(post);
};

exports.deletePost = () => {};

exports.getPostById = () => {};

exports.getPostsByUser = async (req, res) => {
  const posts = await Post.find({ postedBy: req.profile._id }).sort({
    createdAt: "desc",
  });
  res.json(posts);
};

// get the post of user and following
exports.getPostFeed = async (req, res) => {
  const { following, _id } = req.profile;
  following.push(_id);

  const posts = await Post.find({ postedBy: { $in: following } }).sort({
    createdAt: "desc",
  });
  res.json(posts);
};

// this same method is used to like and unlike a post
exports.toggleLike = async (req, res) => {
  // get id of the post to like or unlike
  const { postId } = req.body;

  const post = await Post.findOne({ _id: postId });
  const likeIds = post.likes.map((id) => id.toString());
  const authUserId = req.user._id.toString();

  // if current user has liked it,
  // remove his/her id from the likes array
  if (likeIds.includes(authUserId)) {
    await post.likes.pull(authUserId);
  } else {
    await post.likes.push(authUserId);
  }
  await post.save();
  res.json(post);
};

// used to add and remove comment
exports.toggleComment = async (req, res) => {
  const { comment, postId } = req.body;
  let operator;
  let data;

  if (req.url.includes("uncomment")) {
    operator = "$pull";
    data = { _id: comment._id };
  } else {
    operator = "$push";
    data = { text: comment.text, postedBy: req.user._id };
  }

  const updatedPost = await Post.findOneAndUpdate(
    { _id: postId },
    { [operator]: { comments: data } },
    { new: true }
  )
    .populate("postedBy", "_id name avatar")
    .populate("comments.postedBy", "_id name avatar");

  res.json(updatedPost);
};
