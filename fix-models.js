const fs = require('fs');
const path = require('path');

const modelsDir = './src/models';

function fixModelImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix model imports
    content = content.replace(/from '@\/models\//g, "from './");
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed model imports in: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

const files = fs.readdirSync(modelsDir);
files.forEach(file => {
  if (file.endsWith('.ts')) {
    fixModelImports(path.join(modelsDir, file));
  }
});

console.log('✅ Model imports fixed!');
