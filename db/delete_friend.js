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

// Route to handle friend deletion
app.get('/deleteFriend', (req, res) => {
    const pw = req.query.confirm_delete; // Password input from query parameter
    const buttonId = req.query.button; // Identifies which pal to delete

    let deleteEmail;
    if (buttonId === '1') deleteEmail = req.session['pal_1'];
    if (buttonId === '2') deleteEmail = req.session['pal_2'];
    if (buttonId === '3') deleteEmail = req.session['pal_3'];
    if (buttonId === '4') deleteEmail = req.session['pal_4'];

    const email = req.session.email;

    // Verify password
    const verifyPasswordQuery = `SELECT * FROM Users WHERE email = ? AND password = ?`;
    db.query(verifyPasswordQuery, [email, pw], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error verifying password');
        }

        if (result.length > 0) {
            // Delete from the Route table where penpals match
            const deleteRouteQuery = `
                DELETE FROM Route
                WHERE pen_id IN (
                    SELECT pen_id FROM Penpals
                    WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)
                )
            `;
            db.query(deleteRouteQuery, [email, deleteEmail, deleteEmail, email], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Error deleting from Route table');
                }

                // Delete from Penpals table
                const deletePenpalsQuery = `
                    DELETE FROM Penpals
                    WHERE pen_id IN (
                        SELECT pen_id FROM Penpals
                        WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)
                    )
                `;
                db.query(deletePenpalsQuery, [email, deleteEmail, deleteEmail, email], (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('Error deleting from Penpals table');
                    }

                    // Fetch updated penpals for the user
                    const fetchPenpalsQuery = `SELECT * FROM Penpals WHERE user1 = ? OR user2 = ?`;
                    db.query(fetchPenpalsQuery, [email, email], (err, result) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).send('Error fetching updated penpals');
                        }

                        req.session.numOfPenpals = result.length;

                        // Store the updated penpals in session
                        let i = 1;
                        result.forEach((row) => {
                            const palEmail = (row.user1 !== email) ? row.user1 : row.user2;
                            req.session[`pal_${i}`] = palEmail;
                            i++;
                        });

                        // Redirect to the dashboard
                        res.redirect('/dashboard');
                    });
                });
            });
        } else {
            // Password incorrect
            res.status(400).send('Incorrect password');
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
