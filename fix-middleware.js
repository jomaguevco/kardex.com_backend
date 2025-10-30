const fs = require('fs');
const path = require('path');

const middlewareDir = './src/middleware';

function fixMiddlewareImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix config imports
    content = content.replace(/from '@\/config\//g, "from '../config/");
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed middleware imports in: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

const files = fs.readdirSync(middlewareDir);
files.forEach(file => {
  if (file.endsWith('.ts')) {
    fixMiddlewareImports(path.join(middlewareDir, file));
  }
});

console.log('✅ Middleware imports fixed!');
