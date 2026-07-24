const fs = require('fs');
let content = fs.readFileSync('demo-data.js', 'utf-8');
content = content.replace(/\/images\/propiedades\/[^'"]+/g, '/images/placeholder-property.svg');
content = content.replace(/\/images\/alquileres\/[^'"]+/g, '/images/placeholder-property.svg');
fs.writeFileSync('demo-data.js', content);
console.log('Updated demo images to placeholder');