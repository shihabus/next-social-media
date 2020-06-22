const mongoose = require("mongoose");
const User = mongoose.model("User");
// for upload file handling
const multer = require("multer");
const jimp = require("jimp");
exports.getUsers = async (req, res) => {
  const users = await User.find().select("_id name email createdAt updatedAt");
  res.json(users);
};

// the user will only have access to his/her details
exports.getAuthUser = (req, res) => {
  if (!req.isAuthUser) {
    res.status(403).json({
      message: "You are unauthenticated. Please sign up or sign in.",
    });
    return res.redirect("/signin");
  }
  res.json(req.user);
};

// this one is more like a middleware so we use next
// id is the :userId
exports.getUserById = async (req, res, next, id) => {
  const user = await User.findOne({ _id: id });
  if (!user) {
    return res.status(404).json({ message: "User Id not found" });
  }
  req.profile = user;

  // if the current user id is same as requested user id
  // we need to use ObjectId because we have the current user id in req.user.id as ObjectId
  const profileId = mongoose.Types.ObjectId(req.profile._id);

  if (req.user && profileId.equals(req.user._id)) {
    req.isAuthUser = true;
    return next();
  }
  next();
};

exports.getUserProfile = (req, res) => {
  if (!req.profile) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json(req.profile);
};

exports.getUserFeed = async (req, res) => {
  const { following, _id } = req.profile;
  following.push(_id);
  const users = await User.find({ _id: { $nin: following } }).select(
    "_id name avatar"
  );
  res.json(users);
};

const avatarUploadOptions = {
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

// add req body with key avatar to req.file
exports.uploadAvatar = multer(avatarUploadOptions).single("avatar");

exports.resizeAvatar = async (req, res, next) => {
  // if there is no file
  if (!req.file) {
    return next();
  }

  // if file is added in to req by multer
  const extension = req.file.mimetype.split("/")[1];
  req.body.avatar = `/static/uploads/avatars/${
    req.user.name
  }-${Date.now()}.${extension}`;
  // read the image
  const image = await jimp.read(req.file.buffer);
  // resizing the image. setting the width to AUTO so not to stretch out
  await image.resize(250, jimp.AUTO);
  // writing the image
  await image.write(`./${req.body.avatar}`);
  next()
};

exports.updateUser = async (req, res) => {
  req.body.updatedAt = new Date().toISOString();
  // 1. find user with _id
  // 2. set the entire req body
  // 3. get the updated value and run field validations
  const updatedUser = await User.findOneAndUpdate(
    { _id: req.user._id },
    { $set: req.body },
    { new: true, runValidators: true }
  );
  res.json(updatedUser);
};

exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  // user can delete his/her account
  if (!req.isAuthUser) {
    return res
      .status(404)
      .json({ message: "You are not authorized to perform this action" });
  }
  const deletedUser = await User.findOneAndDelete({ _id: userId });
  res.json(deletedUser);
};

// we have a following[] and we need to add
// the id of the user to be followed into it
exports.addFollowing = async (req, res, next) => {
  const { followId } = req.body;

  // find the current user
  // push the followId to his/her following []
  await User.findOneAndUpdate(
    {
      _id: req.user._id,
    },
    {
      $push: { following: followId },
    }
  );
  next();
};

// now we need to add the user in the followers list of
// the user who was followed
exports.addFollower = async (req, res) => {
  const { followId } = req.body;
  const user = await User.findOneAndUpdate(
    {
      _id: followId,
    },
    {
      $push: { followers: req.user._id },
    },
    {
      new: true,
    }
  );
  res.json(user);
};

exports.deleteFollowing = async (req, res, next) => {
  const { followId } = req.body;

  // find the current user
  // push the followId to his/her following []
  await User.findOneAndUpdate(
    {
      _id: req.user._id,
    },
    {
      $pull: { following: followId },
    }
  );
  next();
};

exports.deleteFollower = async (req, res) => {
  const { followId } = req.body;
  const user = await User.findOneAndUpdate(
    {
      _id: followId,
    },
    {
      $pull: { followers: req.user._id },
    },
    {
      new: true,
    }
  );
  res.json(user);
};
