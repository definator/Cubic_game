const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const serveStatic = require('serve-static');
const fs = require('fs');
const { resolve } = require('path');
const { Recoverable } = require('repl');
const serverActions = {
    cleanRecords: () => {
        fs.writeFile('results.txt', '', err => {
            if(err) throw err;
        });
    }
    
};
const readFile = () => {
    return new Promise((resolve, reject) => {
        fs.readFile('results.txt', 'utf8', (err, data) => {
            if(err) throw err;
            if(!data){
                data = [];
            }else{
                data = JSON.parse(data);
            }
                resolve(data);
        });
    });
};
const addRecord = newData => {

    return new Promise((resolve, reject) => {
        readFile()
        .then(data => {
            if(data.find(user => user.name === newData.name)){
                reject('ERROR: This name already exists');
            }
            else {
                data.push(newData)
                fs.writeFile('results.txt', JSON.stringify(data), err => {
                    if(err) throw err;
                    
                    resolve(data);
                })
            }
        });
    });
    
};
app.use(serveStatic('static', {'index': 'index.html'}));

app.use(bodyParser.json());
app.use(bodyParser.text());
app.get('/results', (req, res) => {
    
    readFile()
    .then(data => res.send(data));

   
});
app.post('/results', (req, res) => {
    if(req.is('text/plain')){
        console.log(req.body);
        serverActions[req.body]();
        res.send();
    }
    addRecord(req.body)
    .then(data => res.send(data),
          err  => res.send(err)
    );
        console.log(req.body);
    
});
app.listen(port);