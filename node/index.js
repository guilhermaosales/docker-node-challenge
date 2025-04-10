const express = require('express')
const mysql = require('mysql')
const app = express()
const port = 3000

const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'app_db',
    user: 'root',
    password: 'root',
    database: 'nodedb',
    waitForConnections: true,
    queueLimit: 0
});

async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Database initialization failed:', err);
                return reject(err);
            }

            // Verify the connection with a ping
            connection.ping(err => {
                if (err) {
                    console.error('Database ping failed:', err);
                    connection.release();
                    return reject(err);
                }

                console.log(`Connected to MySQL as ID ${connection.threadId}`);
                connection.release();
                resolve();
            });
        });
    });
}

// Add error handlers for the pool
pool.on('error', (err) => {
    console.error('MySQL pool error:', err);
});

initializeDatabase()
    .then(() => console.log('Database connection verified'))
    .catch(err => {
        console.error('Database verification failed:', err);
        process.exit(1);
    });


app.get('/', (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Connection error:', err);
            return res.status(500).send('<h1>Database Connection Error</h1>');
        }

        const personName = `Person_${Math.floor(Math.random() * 1000)}`;

        // First query: INSERT
        connection.query(
            'INSERT INTO people (name) VALUES (?)',
            [personName],
            (insertError) => {
                if (insertError) {
                    connection.release();
                    console.error('Insert error:', insertError);
                    return res.status(500).send('<h1>Insert Error</h1>');
                }

                // Second query: SELECT
                connection.query(
                    'SELECT * FROM people ORDER BY id DESC',
                    (selectError, results) => {
                        connection.release(); // Always release connection

                        if (selectError) {
                            console.error('Select error:', selectError);
                            return res.status(500).send('<h1>Query Error</h1>');
                        }

                        // Build response
                        const html = `
                                <h1>Full Cycle Rocks!</h1>
                                <ul>
                                    ${results.map(row => `<li>${row.name}</li>`).join('')}
                                </ul>
                            `;
                        res.send(html);
                    }
                );
            }
        );
    });
});


app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})

module.exports = pool
