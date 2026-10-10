import http from 'node:http';
import { readFile, watch } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('./public/', import.meta.url));
const port = Number(process.env.PORT || 3000);
const clients = new Set();
const assets = new Map([
  ['/', ['index.html', 'text/html']],
  ['/index.html', ['index.html', 'text/html']],
  ['/styles.css', ['styles.css', 'text/css']],
  ['/app.js', ['app.js', 'text/javascript']],
  ['/data.js', ['data.js', 'text/javascript']],
]);
const server = http.createServer((req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  if (path === '/__reload') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(': connected\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }
  const asset = assets.get(path);
  if (!asset) { res.writeHead(404); res.end('Not found'); return; }
  readFile(root + asset[0], (error, data) => {
    if (error) { res.writeHead(500); res.end('Cannot read file'); return; }
    res.writeHead(200, { 'Content-Type': asset[1] + '; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(data);
  });
});
let timer;
const watcher = watch(root, () => {
  clearTimeout(timer);
  timer = setTimeout(() => { for (const client of clients) client.write('data: reload\n\n'); }, 120);
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? `ポート ${port} は使用中です。PORT=3001 npm run dev を試してください。` : error.message);
  watcher.close(); process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => console.log(`JOB NOVA: http://localhost:${port}\n終了: Ctrl+C / public 内の保存でブラウザ自動更新`));
