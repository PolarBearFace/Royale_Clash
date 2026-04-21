const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 2003;

const consoleInjection = `
<script>
(function() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    function sendLog(type, args) {
        fetch('/api/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, message: args.map(a => 
                typeof a === 'object' ? JSON.stringify(a) : String(a)
            ).join(' ') })
        }).catch(e => {});
    }
    
    console.log = function(...args) {
        originalLog.apply(console, args);
        sendLog('log', args);
    };
    
    console.error = function(...args) {
        originalError.apply(console, args);
        sendLog('error', args);
    };
    
    console.warn = function(...args) {
        originalWarn.apply(console, args);
        sendLog('warn', args);
    };
})();
</script>
`;

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/api/log') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { type, message } = JSON.parse(body);
                console.log(`[${type.toUpperCase()}] ${message}`);
            } catch (e) {}
            res.writeHead(200);
            res.end();
        });
        return;
    }
    
    const gameRoot = path.resolve(__dirname, 'GameFiles');
    const requestPath = (req.url || '/').split('?')[0];
    const relativePath = requestPath === '/' ? 'game.html' : requestPath.replace(/^\/+/, '');
    const filePath = path.resolve(gameRoot, relativePath);

    if (filePath !== gameRoot && !filePath.startsWith(gameRoot + path.sep)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
            return;
        }
        
        const ext = path.extname(filePath);
        let contentType = 'text/plain';
        
        if (ext === '.html') contentType = 'text/html';
        else if (ext === '.css') contentType = 'text/css';
        else if (ext === '.js') contentType = 'application/javascript';
        
        res.writeHead(200, { 'Content-Type': contentType });
        
        // Inject console capture into HTML files
        if (ext === '.html') {
            content = content.toString().replace('</head>', consoleInjection + '</head>');
        }
        
        res.end(content);
    });
});

server.listen(PORT, () => {
    console.log(`Game running at http://localhost:${PORT}`);
});
