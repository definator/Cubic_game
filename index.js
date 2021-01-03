const express = require('express');
const app = express();
const port = 3000;
const serveStatic = require('serve-static');

app.use(serveStatic('static', {'index': 'index.html'}));

app.listen(port);