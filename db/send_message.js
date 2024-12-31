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

// Route to send a message
app.get('/send-message', (req, res) => {
    const email = req.session.email; // Assume the email is stored in session
    const context = req.query.Message;
    const receiver = req.session.recievers; // Reciever's email

    // Check if the sender and receiver have a route
    db.query(
        "SELECT pen_id FROM Penpals WHERE (user1 = ? AND user2 = ?) OR (user2 = ? AND user1 = ?)",
        [email, receiver, email, receiver],
        (err, result) => {
            if (err) throw err;

            if (result.length > 0) {
                const pen_id = result[0].pen_id;

                // Check if a route exists
                db.query(
                    "SELECT route FROM Route WHERE pen_id = ? AND sender = ?",
                    [pen_id, email],
                    (err, result) => {
                        if (err) throw err;

                        if (result.length > 0) {
                            const route = result[0].route;

                            // Insert message into Messages table
                            db.query(
                                "INSERT INTO Messages (route, content) VALUES (?, ?)",
                                [route, context],
                                (err, result) => {
                                    if (err) throw err;
                                    res.redirect('/dashboard');
                                }
                            );
                        } else {
                            // If no route exists, create a new route and insert the message
                            db.query(
                                "INSERT INTO Route (pen_id, sender) VALUES (?, ?)",
                                [pen_id, email],
                                (err, result) => {
                                    if (err) throw err;

                                    db.query(
                                        "SELECT route FROM Route WHERE pen_id = ? AND sender = ?",
                                        [pen_id, email],
                                        (err, result) => {
                                            if (err) throw err;
                                            const route = result[0].route;

                                            db.query(
                                                "INSERT INTO Messages (route, content) VALUES (?, ?)",
                                                [route, context],
                                                (err, result) => {
                                                    if (err) throw err;
                                                    res.redirect('/dashboard');
                                                }
                                            );
                                        }
                                    );
                                }
                            );
                        }
                    }
                );
            }
        }
    );
});

// Route for dashboard (or you can handle other routes as needed)
app.get('/dashboard', (req, res) => {
    if (req.session.logged_in) {
        res.send(`Welcome to the dashboard, ${req.session.username}`);
    } else {
        res.redirect('/');
    }
});

// Route to handle index (login page)
app.get('/', (req, res) => {
    res.send('<form method="POST" action="/login">Email: <input type="email" name="email"><br>Password: <input type="password" name="password"><br><input type="submit" value="Login"></form>');
});

// Route to handle login (you'll need to implement this logic)
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.query(
        "SELECT * FROM Users WHERE email = ? AND password = ?",
        [email, password],
        (err, result) => {
            if (err) throw err;

            if (result.length > 0) {
                req.session.logged_in = true;
                req.session.email = email;
                req.session.username = result[0].name;

                // Redirect to the dashboard
                res.redirect('/dashboard');
            } else {
                res.redirect('/');
            }
        }
    );
});

// Start server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
