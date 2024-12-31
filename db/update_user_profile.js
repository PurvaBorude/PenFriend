const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// Middleware to parse URL-encoded data (for form submissions)
app.use(bodyParser.urlencoded({ extended: true }));

// Create MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'DBMS'
});

// Connect to MySQL
db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL!');
});

// Route to handle user update (password update)
app.post('/updateUser', (req, res) => {
    const { name, email, new_pw } = req.body; // Extract values from POST request

    // SQL query to check if the user exists with the given name and email
    const checkUserQuery = `
        SELECT * FROM Users 
        WHERE email = ? AND name = ?
    `;
    db.query(checkUserQuery, [email, name], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error checking user');
        }

        if (result.length > 0) {
            // User exists, update the password
            const updatePasswordQuery = `
                UPDATE Users 
                SET password = ? 
                WHERE email = ? AND name = ?
            `;
            db.query(updatePasswordQuery, [new_pw, email, name], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Error updating password');
                }

                // Redirect after successful update
                res.redirect('http://localhost:3000');
            });
        } else {
            // User doesn't exist
            res.status(404).send('User not found');
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
