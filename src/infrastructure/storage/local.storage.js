const fs = require('fs');
const path = require('path');

const STORAGE_DIR = path.join(__dirname, '..', '..', '..', 'uploads');
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

const saveFile = (filename, buffer) => {
  const filePath = path.join(STORAGE_DIR, filename);
  fs.writeFileSync(filePath, buffer);
  return filePath;
};

const deleteFile = (filename) => {
  const filePath = path.join(STORAGE_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
};

const getFileStream = (filename) => {
  const filePath = path.join(STORAGE_DIR, filename);
  if (fs.existsSync(filePath)) {
    return fs.createReadStream(filePath);
  }
  return null;
};

module.exports = {
  saveFile,
  deleteFile,
  getFileStream,
  STORAGE_DIR,
};
