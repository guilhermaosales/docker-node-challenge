const express = require('express')
const mysql = require('mysql')
const app = express()
const port = 3000

const config = mysql.createPool({
    connectionLimit: 10,
    host: 'app_db',
    user: 'root',
    password: 'root',
    database: 'nodedb',
    waitForConnections: true,
    queueLimit: 0
  });

const connection = mysql.createConnection(config)

connection.connect((err, connection) => {
    if (err) {
      console.error('Error connecting to MySQL: ' + err.stack);
      return;
    }
    console.log('Connected to MySQL as ID ' + connection.threadId);
  });


app.get('/', async(req, res) => {
    try {
        const personName = `Person_${Math.floor(Math.random() * 100)}`;
        
        const insertData = `INSERT INTO people(name) VALUES(?)`;
        await new Promise((resolve, reject) => {
            config.query(insertData, [personName], (err, result) => {
                if (err) {
                    console.error('Error executing query: ', err.stack);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        const fetchData = `SELECT * FROM people`;
        config.query(fetchData, (err, results) => {
            if (err) {
                console.error('Error fetching data: ', err.stack);
                return res.status(500).send('Error fetching data');
            }

            let response = '<h1>Full Cycle Rocks!</h1>';
            response += '<h2>People List:</h2>';
            response += '<ul>';
            results.forEach(person => {
                response += `<li>${person.name}</li>`;
            });
            response += '</ul>';
            
            res.status(200).send(response);
        });
    }
    catch (err) {
        console.error('Error in route: ', err);
        res.status(500).send('Internal Server Error');
    }
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})