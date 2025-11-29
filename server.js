const { createServer } = require('http');
const next = require('next');
 
const port = process.env.PORT || 3000; // IIS runs on port 80
const app = next({ dev: false });
const handle = app.getRequestHandler();
 
app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, (err) => {
	  console.log(`> Ready on http://localhost:${port}`);
    if (err) throw err;
    
  });
});