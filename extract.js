const fs = require('fs');
const c = fs.readFileSync('C:/Users/KRJ/OneDrive/Desktop/EIP/index.html', 'utf8');
const lines = c.split(/\r?\n/);
for (let i = 1520; i < 1670 && i < lines.length; i++) {
  console.log((i+1) + ': ' + lines[i]);
}
