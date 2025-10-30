const fs = require('fs');
const path = require('path');

const routesDir = './src/routes';

function fixRouteImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix controller imports
    content = content.replace(/from '@\/controllers\//g, "from '../controllers/");
    
    // Fix middleware imports
    content = content.replace(/from '@\/middleware\//g, "from '../middleware/");
    
    // Fix model imports
    content = content.replace(/from '@\/models\//g, "from '../models/");
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed route imports in: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

const files = fs.readdirSync(routesDir);
files.forEach(file => {
  if (file.endsWith('.ts')) {
    fixRouteImports(path.join(routesDir, file));
  }
});

console.log('✅ Route imports fixed!');
