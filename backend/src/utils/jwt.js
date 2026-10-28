const jwt = require('jsonwebtoken');

const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'super_secret_midflow_jwt_dev_key_2026', {
    expiresIn: '7d',
  });
};

module.exports = { signToken };
