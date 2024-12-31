const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const port = 3000;

// Middleware for parsing request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'DBMS',
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL database');
});

// POST route to handle registration
app.post('/register', (req, res) => {
    const { name, email, pw } = req.body;

    // Check if the email already exists
    const checkEmailQuery = 'SELECT * FROM `Users` WHERE email = ?';
    db.execute(checkEmailQuery, [email], (err, result) => {
        if (err) {
            console.error('Error querying database: ', err);
            return res.status(500).send('Internal Server Error');
        }

        if (result.length === 0) {
            // Insert new user into Users table
            const insertUserQuery = 'INSERT INTO `Users` (`name`, `email`, `password`) VALUES (?, ?, ?)';
            db.execute(insertUserQuery, [name, email, pw], (err, result) => {
                if (err) {
                    console.error('Error inserting user: ', err);
                    return res.status(500).send('Internal Server Error');
                }

                // Insert empty interests and languages for new user
                const insertInterestsQuery = 'INSERT INTO `Interests` (`email`) VALUES (?)';
                db.execute(insertInterestsQuery, [email], (err) => {
                    if (err) {
                        console.error('Error inserting interests: ', err);
                    }
                });

                const insertLanguagesQuery = 'INSERT INTO `Languages` (`email`) VALUES (?)';
                db.execute(insertLanguagesQuery, [email], (err) => {
                    if (err) {
                        console.error('Error inserting languages: ', err);
                    }
                });

                // Set session variables
                req.session.logged_in = true;
                req.session.username = name;
                req.session.email = email;
                req.session.user_pw = pw;

                // Redirect user to home page or wherever you want
                res.redirect('/home');
            });
        } else {
            res.status(400).send('Email already exists!');
        }
    });
});

// Placeholder home route
app.get('/home', (req, res) => {
    if (req.session.logged_in) {
        res.send(`Welcome, ${req.session.username}`);
    } else {
        res.redirect('/');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
