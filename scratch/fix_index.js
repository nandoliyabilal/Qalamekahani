const fs = require('fs');
const path = 'index.html';
let content = fs.readFileSync(path, 'utf8');

// Flexible cleanup
content = content.replace(/<script src="js\/main.js"><\/script>\s*<script src="js\/global-horror.js"><\/script>\s*<\/body>\s*<\/html>(\s*\}\);\s*<\/script>\s*<\/body>\s*<\/html>)?/g, 
`    <script src="js/main.js" defer></script>
    <script>
        window.addEventListener('load', () => {
            const script = document.createElement('script');
            script.src = 'js/global-horror.js';
            script.defer = true;
            document.body.appendChild(script);
        });
    </script>
</body>
</html>`);

fs.writeFileSync(path, content);
console.log('Fixed exactly!');
