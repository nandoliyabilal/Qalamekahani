const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, ''); // /admin

const htmlFiles = fs.readdirSync(directoryPath).filter(file => file.endsWith('.html'));

const insertPattern = /<a href="reviews\.html"/;

htmlFiles.forEach(file => {
    const filePath = path.join(directoryPath, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove old broken inserts
    content = content.replace(/<a href="images\.html" class="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"><i data-lucide="image"><\/i>Images<\/a>/g, '');

    // Check if valid page to insert (needs a sidebar)
    if (insertPattern.test(content) && !content.includes('href="images.html"')) {
        let imageLink = `\n            <a href="images.html"\n                class="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">\n                <i data-lucide="image"></i>\n                Images\n            </a>\n            <a href="reviews.html"`;
        
        content = content.replace(/<a href="reviews\.html"/, imageLink.trim());
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
