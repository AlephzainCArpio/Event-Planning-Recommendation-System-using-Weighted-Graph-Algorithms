const path = require("path");

const uniqueUploadFilename = (originalname) =>
  Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(originalname);

module.exports = { uniqueUploadFilename };
