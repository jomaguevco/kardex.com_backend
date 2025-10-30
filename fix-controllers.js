const fs = require('fs');
const path = require('path');

const controllersDir = './src/controllers';

function fixControllerImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix model imports
    content = content.replace(/from '@\/models'/g, "from '../models'");
    
    // Fix middleware imports
    content = content.replace(/from '@\/middleware\//g, "from '../middleware/");
    
    // Fix config imports
    content = content.replace(/from '@\/config\//g, "from '../config/");
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed controller imports in: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

const files = fs.readdirSync(controllersDir);
files.forEach(file => {
  if (file.endsWith('.ts')) {
    fixControllerImports(path.join(controllersDir, file));
  }
});

console.log('✅ Controller imports fixed!');
