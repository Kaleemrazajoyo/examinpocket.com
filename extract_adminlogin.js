const fs = require('fs');
const c = fs.readFileSync('C:/Users/KRJ/OneDrive/Desktop/EIP/mern/client/src/pages/admin/AdminLoginPage.jsx', 'utf8');
const lines = c.split(/\r?\n/);
for (let i = 0; i < 90 && i < lines.length; i++) {
  console.log((i+1) + ': ' + lines[i]);
}
