require("dotenv").config()
const jwt = require('jsonwebtoken')
const createJWT = ({ payload }) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn:`${process.env.JWT_LIFETIME}`
  });
  return token;
};

module.exports = createJWT