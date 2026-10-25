const fs = require('fs');
const c = fs.readFileSync('C:/Users/KRJ/OneDrive/Desktop/EIP/mern/client/src/pages/admin/AdminDashboard.jsx', 'utf8');
const lines = c.split(/\r?\n/);
for (let i = Math.max(0, lines.length-80); i < lines.length; i++) {
  console.log((i+1) + ': ' + lines[i]);
}
