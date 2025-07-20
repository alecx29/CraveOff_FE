const fs = require("fs");
const jwt = require("jsonwebtoken");

const privateKey = fs.readFileSync("./AuthKey_CM34G4VURA.p8"); // ← numele fișierului tău
const token = jwt.sign({}, privateKey, {
  algorithm: "ES256",
  expiresIn: "180d", // maximum allowed
  audience: "https://appleid.apple.com",
  issuer: "S5YUB44YKU", // ← ex: "8ACXYZ1234"
  subject: "com.usualsuspect29.craveoffapp.login", // ← ex: "com.usualsuspect29.craveoffapp"
  keyid: "NY8C834639", // ← ex: "ABC123XYZ"
});

console.log(token);
