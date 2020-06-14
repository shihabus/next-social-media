const mongoose = require("mongoose");
const User = mongoose.model("User");
const passport = require("passport");

exports.validateSignup = (req, res, next) => {
  // sanitizeBody from express validator
  req.sanitizeBody("name");
  req.sanitizeBody("email");
  req.sanitizeBody("password");

  // check name is notNull and 4 to 5 char long
  req.checkBody("name", "Enter a name").notEmpty();
  req
    .checkBody("name", "Name must be between 4 and 10 characters")
    .isLength({ min: 4, max: 10 });

  // email: not null, valid and normalized
  req.checkBody("email", "Enter a valid email").isEmail().normalizeEmail();

  // password: between 4 and 10 characters
  req.checkBody("password").notEmpty();
  req
    .checkBody("password", "Password must be between 4 and 10 characters")
    .isLength({ min: 4, max: 10 });

  const errors = req.validationErrors();
  if (errors) {
    const firstErr = errors.map((err) => err.msg)[0];
    return res.status(400).send(firstErr);
  }

  // if no error continue to next handler
  next();
};

exports.signup = async (req, res, next) => {
  const { name, email, password } = req.body;
  // passport-local-mongoose will hash the password and save it automatically
  const user = await new User({ name, email, password });

  await User.register(user, password, (err, user) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json(user);
  });
};

exports.signin = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(500).json(err.message);
    }
    if (!user) {
      return res.status(400).json(info.message);
    }

    req.login(user, (err) => {
      if (err) {
        return res.status(500).json(err.message);
      }

      res.json(user);
    });
  })(req, res, next);
};

exports.signout = (req, res) => {
  // clear cookie
  // next-cookie.sid is the cookie name
  res.clearCookie("next-cookie.sid");
  req.logout();
  res.json({ message: "You are signed out" });
};

exports.checkAuth = (req, res, next) => {
  // isAuthenticated: from passport
  if (req.isAuthenticated()) {
    next();
  }
  res.redirect("/signin");
};
