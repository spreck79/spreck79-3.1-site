// Tiny local preview server for this site: node tools/serve.js [port]
// Serves the repo folder on http://localhost:7931 (your computer only). Hidden files are never served.
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const port = +process.argv[2] || 7931;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.md': 'text/plain' };
http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const p = path.normalize(path.join(root, url === '/' ? 'index.html' : url));
  if (!p.startsWith(root) || path.relative(root, p).split(path.sep).some((s) => s.startsWith('.'))) { res.writeHead(403); return res.end(); }
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, '127.0.0.1', () => console.log('spreck79 3.1 preview on http://localhost:' + port));
