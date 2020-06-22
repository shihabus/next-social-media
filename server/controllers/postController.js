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

exports.getPostsByUser = () => {};

exports.getPostFeed = () => {};

exports.toggleLike = () => {};

exports.toggleComment = () => {};
