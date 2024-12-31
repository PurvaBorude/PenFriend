const express = require('express');
const session = require('express-session');
const mysql = require('mysql2');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Create MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'DBMS'
});

// Connect to the database
db.connect((err) => {
    if (err) throw err;
    console.log('Connected to the database');
});

// Route to register a new user
app.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    // Check if the email already exists
    db.query(
        "SELECT * FROM `Users` WHERE email = ?",
        [email],
        (err, result) => {
            if (err) throw err;

            // If email doesn't exist, insert the new user into Users table
            if (result.length === 0) {
                db.query(
                    "INSERT INTO `Users` (`name`, `email`, `password`) VALUES (?, ?, ?)",
                    [name, email, password],
                    (err, result) => {
                        if (err) throw err;

                        // Insert interests and languages for the new user
                        db.query(
                            "INSERT INTO `Interests` (`email`) VALUES (?)",
                            [email],
                            (err, result) => {
                                if (err) throw err;

                                db.query(
                                    "INSERT INTO `Languages` (`email`) VALUES (?)",
                                    [email],
                                    (err, result) => {
                                        if (err) throw err;

                                        // Set session values for the logged-in user
                                        req.session.logged_in = 1;
                                        req.session.username = name;
                                        req.session.email = email;
                                        req.session.user_pw = password;

                                        // Redirect to the home page (or wherever)
                                        res.redirect('/home');
                                    }
                                );
                            }
                        );
                    }
                );
            } else {
                // If the email already exists, redirect back to the index page
                res.redirect('/');
            }
        }
    );
});

// Route to handle home page (after login or registration)
app.get('/home', (req, res) => {
    if (req.session.logged_in) {
        res.send(`Welcome, ${req.session.username}`);
    } else {
        res.redirect('/');
    }
});

// Route for index (registration form)
app.get('/', (req, res) => {
    res.send('<form method="POST" action="/register">Name: <input type="text" name="name"><br>Email: <input type="email" name="email1"><br>Password: <input type="password" name="pw1"><br><input type="submit" value="Register"></form>');
});

// Start server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
