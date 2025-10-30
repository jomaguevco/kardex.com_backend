const fs = require('fs');
const path = require('path');

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace path aliases with relative imports
    content = content.replace(/from '@\/config'/g, "from '../config'");
    content = content.replace(/from '@\/controllers'/g, "from '../controllers'");
    content = content.replace(/from '@\/models'/g, "from '../models'");
    content = content.replace(/from '@\/routes'/g, "from '../routes'");
    content = content.replace(/from '@\/middleware'/g, "from '../middleware'");
    content = content.replace(/from '@\/services'/g, "from '../services'");
    content = content.replace(/from '@\/utils'/g, "from '../utils'");
    
    // Handle specific model imports
    content = content.replace(/from '@\/models\/index'/g, "from '../models'");
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed imports in: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDir(filePath);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fixImportsInFile(filePath);
    }
  });
}

console.log('🔧 Fixing path aliases in TypeScript files...');
walkDir('./src');
console.log('✅ All imports fixed!');
