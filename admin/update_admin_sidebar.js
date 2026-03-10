const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, ''); // /admin

const htmlFiles = fs.readdirSync(directoryPath).filter(file => file.endsWith('.html'));

const insertAfterPattern = `<i data-lucide="file-text"></i>Blogs</a>`;
const replacementHTML = `
            <a href="blogs.html" class="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"><i data-lucide="file-text"></i>Blogs</a>
            <a href="images.html" class="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"><i data-lucide="image"></i>Images</a>
`;

// Also handle the case where "Blogs" is active
const activeInsertAfterPattern = `<i data-lucide="file-text"></i>Blogs</a>`; // Wait, if it's active it has different CSS.

htmlFiles.forEach(file => {
    const filePath = path.join(directoryPath, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Simple replacement using a regex or split. Let's look for the entire <a> tag for blogs
    const blogMatch = content.match(/<a href="blogs\.html"([^>]*)>(.*?)<i data-lucide="file-text"><\/i>Blogs<\/a>/s);

    if (blogMatch) {
       let fullTag = blogMatch[0];
       let imageTag = `\n            <a href="images.html" class="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"><i data-lucide="image"></i>Images</a>`;
       
       if (!content.includes('href="images.html"')) {
           content = content.replace(fullTag, fullTag + imageTag);
           fs.writeFileSync(filePath, content, 'utf8');
           console.log(`Updated sidebar in ${file}`);
       }
    }
});
