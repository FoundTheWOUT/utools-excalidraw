const fs = require("node:fs");
window.utools = utools;

window.writeFile = (path, data, opts) => {
  const { encoding, isArrayBuffer } = Object.assign(
    // default options
    { encoding: "utf8", isArrayBuffer: false },
    opts
  );
  if (isArrayBuffer) data = Buffer.from(data);
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, encoding, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};
