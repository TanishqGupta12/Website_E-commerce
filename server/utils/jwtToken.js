
// create token and create cookie
const SendToken = (user, res, token) => {
  const options = {
    expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  res.cookie('cookietoken', token, options).status(200).json({
    success: true,
    user,
    token,
  });
};

module.exports = SendToken;
