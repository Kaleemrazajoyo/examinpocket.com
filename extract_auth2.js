const fs = require('fs');
const c = fs.readFileSync('C:/Users/KRJ/OneDrive/Desktop/EIP/mern/client/src/context/AuthContext.jsx', 'utf8');
const lines = c.split(/\r?\n/);
for (let i = 0; i < 150 && i < lines.length; i++) {
  console.log((i+1) + ': ' + lines[i]);
}
