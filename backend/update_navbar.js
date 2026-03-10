const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../');

const htmlFiles = fs.readdirSync(directoryPath).filter(file => file.endsWith('.html'));

const oldNavbarLine1 = `<li><a href="stories.html">Stories</a></li>`;
const oldNavbarLine2 = `<li><a href="stories.html" class="active">Stories</a></li>`;

const newNavbarHTML = `
                <li class="dropdown">
                    <a href="stories.html">Stories <i class="fas fa-chevron-down" style="font-size: 0.8em;"></i></a>
                    <ul class="dropdown-menu">
                        <li><a href="stories.html">Reading Stories</a></li>
                        <li><a href="gallery.html">Images & Wallpapers</a></li>
                    </ul>
                </li>
`;

const newNavbarHTMLActive = `
                <li class="dropdown">
                    <a href="stories.html" class="active">Stories <i class="fas fa-chevron-down" style="font-size: 0.8em;"></i></a>
                    <ul class="dropdown-menu">
                        <li><a href="stories.html">Reading Stories</a></li>
                        <li><a href="gallery.html">Images & Wallpapers</a></li>
                    </ul>
                </li>
`;


htmlFiles.forEach(file => {
    const filePath = path.join(directoryPath, file);
    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes(oldNavbarLine1)) {
        content = content.replace(oldNavbarLine1, newNavbarHTML.trim());
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    } else if (content.includes(oldNavbarLine2)) {
        content = content.replace(oldNavbarLine2, newNavbarHTMLActive.trim());
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file} (active state)`);
    } else {
        console.log(`Skipped ${file} (pattern not found)`);
    }
});
