const { log } = require("console");
const models = require("../models/sign_model");
const Errorhandler = require("../utils/errorhander");

const SendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail.js");

const crypto = require("crypto");

exports.signup = async (req, res, next) => {
  const { Name, Email, Password, Address, PhoneNumber, Avatar } = req.body;
  try {
    const user = await models.create({
      Name,
      Email,
      Password,
      Address,
      PhoneNumber,
      Avatar,
    });
    const token = await user.getJWTToKen();

    SendToken(user, res, token);
  } catch (error) {
    res.status(501).json({
      success: false,
      error,
    });
  }
};

//  login
exports.login = async (req, res, next) => {
  try {
    const { Email, Password } = req.body;

    if (!Email || !Password) {
      throw new Error("Please enter Email and Password");
    }

    const user = await models.findOne({ Email }).select("+Password");
    if (!user || !(await user.comparePassword(Password))) {
      throw new Error("Invalid Email or Password");
    }

    const token = await user.getJWTToken();

    SendToken(user, res, token);
  } catch (error) {
    res.status(401).json({ success: false, error: error.message });
  }
};

// login out

exports.logout = async (req, res, next) => {
  try {
    // Clear the "Token" cookie by setting it to null and expiring it immediately
    res.cookie("cookietoken", null, {
      expires: new Date(0),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(501).json({
      success: false,
      error: error.message,
    });
  }
};

//  forget Password

exports.forgotPassword = async (req, res, next) => {
  try {
    const { Email } = req.body;
    console.log({ Email });
    const user = await models.findOne({ Email: Email });

    if (!user) {
      return next(new Errorhandler("User not found", 404));
    }

    const resetToken = user.getRetSetPassword();

    await user.save({ validateBeforeSave: false });

    // const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`;
    const data = "http://localhost:3000"
    const resetPasswordUrl = `${data}/password/reset/${resetToken}`;

    const message = `Your password reset token is temp :\n\n${resetPasswordUrl}\n\nIf you did not request this email, please ignore it.`;

    try {
      await sendEmail({
        Email: user.Email,
        subject: "Password Recovery",
        message,
        res,
      });

      res.status(200).json({
        success: true,
        message: `Email sent to ${user.Email} successfully`,
      });
    } catch (error) {
      user.resetPasswardToken = undefined;
      user.resetPasswardExprise = undefined;

      await user.save();

      return next(new Errorhandler("Email could not be sented", 500));
    }
  } catch (error) {
    return next(new Errorhandler(error.message, 500));
  }
};

exports.resetPassword = async (req, res, next) => {

  console.log((req.params.token).split(":"));
  console.log(req.params.token);

  console.log(req.body.password);
  console.log(req.body.confirmPassword);

  const resetPasswardToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  try {
    const user = await models.findOne({
      resetPasswardToken,
      resetPasswardExprise: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ error: "Reset password token is invalid or has expired" });
    }

    if (req.body.password !== req.body.confirmPassword) {
      return res.status(400).json({ error : "Passwords do not match" });
    }

    // Update user's password and clear resetPasswordToken and resetPasswordExpire fields
    user.password = req.body.password;
    user.resetPasswardToken = undefined;
    user.resetPasswardExprise = undefined;

    await user.save();

    SendToken(user, 200, res);
  } catch (err) {
    return next(err);
  }
};

//  get user detail

exports.getUserDetails = async (req, res, next) => {
  try {
    // console.log('Cookies: ', req.cookies)
    const user = await models.findById(req.user.id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(200).json({
      success: false,
      error,
    });
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const user = await models.findById(req.user.id).select("+password");

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword); // Call comparePassword on user object

    if (!isPasswordMatched) {
      return next(new Errorhandler("Old Password I Password", 401)); // Update error handling
    }

    if (req.body.newPassword !== req.body.comfirmPassword) {
      return next(new Errorhandler("Password does not match", 401));
    }

    user.Password = req.body.newPassword;
    await user.save();

    SendToken(user, 200, req);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new Errorhandler(error.message, 500));
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const newUserDate = {
      Name: req.body.Name,
      Email: req.body.Email,
      Address: req.body.Address,
      PhoneNumber: req.body.PhoneNumber,
    };
    if (req.file) {
      newUserDate.Avatar = req.file.filename;
    }

    const user = await models.findByIdAndUpdate(req.user.id, newUserDate, {
      new: true,
      runValidators: true,
      useFindAndModify: true,
    });

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    return next(new Errorhandler(error.message, 500));
  }
};

//  get user admin
exports.getAllUser = async (req, res, next) => {
  try {
    const users = await models.find();

    if (!users || users.length === 0) {
      return next(new Errorhandler(`No users found`));
    }

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

exports.getsinghUser = async (req, res, next) => {
  try {
    const user = await models.findById(req.params.id);

    if (!user) {
      return next(
        new Errorhandler(`User Does not exist with id ${req.params.id}`)
      );
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(502).json({
      success: false,
    });
  }
};

exports.deleteProfile = async (req, res, next) => {
  try {
    user = await models.findByIdAndUpdate(req.params.id);

    if (!user) {
      return next(new Errorhandler("user not find", 500));
    }

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    return next(new Errorhandler(error.message, 500));
  }
};

exports.updateProfileRole = async (req, res, next) => {
  try {
    const newUserDate = {
      role: req.body.role,
    };

    await models.findByIdAndDelete(req.params.id, newUserDate, {
      new: true,
      runValidators: true,
      usefindandmodify: false,
    });

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    return next(new Errorhandler(error.message, 500));
  }
};
