const mongoose = require("mongoose");
const User = mongoose.model("User");

exports.getUsers = async (req, res) => {
  const users = await User.find().select("_id name email createdAt updatedAt");
  res.json(users);
};

exports.getAuthUser = () => {};

// this one is more like a middleware so we use next
// id is the :userId
exports.getUserById = async (req, res, next, id) => {
  const user = await User.findOne({ _id: id });
  console.log("user", req.user);
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

exports.getUserProfile = () => {};

exports.getUserFeed = () => {};

exports.uploadAvatar = () => {};

exports.resizeAvatar = () => {};

exports.updateUser = () => {};

exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  // user can delete his/her account
  if (!req.isAuthUser) {
    return res
      .status(404)
      .json({ message: "You are not authorized to perform this action" });
  }
  const deletedUser = await User.findOneAndDelete({ _id: userId });
  console.log("deletedUser", deletedUser);
  res.json(deletedUser);
};

exports.addFollowing = () => {};

exports.addFollower = () => {};

exports.deleteFollowing = () => {};

exports.deleteFollower = () => {};
