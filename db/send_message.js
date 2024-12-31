const express = require('express');
const session = require('express-session');
const mysql = require('mysql');
const app = express();
const port = 3000;

// Middleware to parse URL-encoded data (for form submissions)
app.use(express.urlencoded({ extended: true }));
// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

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

// Route to handle message sending
app.get('/sendMessage', (req, res) => {
    const email = req.session.email; // Sender's email
    const context = req.query.Message; // Message content

    let receiver;
    const buttonId = req.query.Sends;
    if (buttonId === '1') receiver = req.session['pal_1'];
    if (buttonId === '2') receiver = req.session['pal_2'];
    if (buttonId === '3') receiver = req.session['pal_3'];
    if (buttonId === '4') receiver = req.session['pal_4'];

    // Check if a penpal relationship exists
    const checkPenpalQuery = `
        SELECT pen_id FROM Penpals 
        WHERE (user1 = ? AND user2 = ?) OR (user2 = ? AND user1 = ?)
    `;
    db.query(checkPenpalQuery, [email, receiver, email, receiver], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error checking penpal relationship');
        }

        if (result.length > 0) {
            const pen_id = result[0].pen_id;

            // Check if a route exists for the sender
            const checkRouteQuery = `
                SELECT route FROM Route 
                WHERE pen_id = ? AND sender = ?
            `;
            db.query(checkRouteQuery, [pen_id, email], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Error checking route');
                }

                if (result.length > 0) {
                    const route = result[0].route;

                    // Insert message into the Messages table
                    const insertMessageQuery = `
                        INSERT INTO Messages (route, content) 
                        VALUES (?, ?)
                    `;
                    db.query(insertMessageQuery, [route, context], (err, result) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).send('Error inserting message');
                        }

                        // Redirect to dashboard
                        res.redirect('/dashboard');
                    });
                } else {
                    // No route found for sender, create new route
                    const insertRouteQuery = `
                        INSERT INTO Route (pen_id, sender) 
                        VALUES (?, ?)
                    `;
                    db.query(insertRouteQuery, [pen_id, email], (err, result) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).send('Error inserting route');
                        }

                        // Fetch the route
                        const fetchRouteQuery = `
                            SELECT route FROM Route 
                            WHERE pen_id = ? AND sender = ?
                        `;
                        db.query(fetchRouteQuery, [pen_id, email], (err, result) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).send('Error fetching route');
                            }

                            const route = result[0].route;

                            // Insert message into Messages table
                            const insertMessageQuery = `
                                INSERT INTO Messages (route, content) 
                                VALUES (?, ?)
                            `;
                            db.query(insertMessageQuery, [route, context], (err, result) => {
                                if (err) {
                                    console.error(err);
                                    return res.status(500).send('Error inserting message');
                                }

                                // Redirect to dashboard
                                res.redirect('/dashboard');
                            });
                        });
                    });
                }
            });
        } else {
            // No penpal relationship found
            res.status(400).send('No penpal relationship found');
        }
    });
});

// Route for dashboard
app.get('/dashboard', (req, res) => {
    res.send('Welcome to your Pen Pal Dashboard!');
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
