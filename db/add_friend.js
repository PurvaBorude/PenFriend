const express = require('express');
const session = require('express-session');
const mysql = require('mysql');
const app = express();
const port = 3000;

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

// Route for handling penpal logic
app.get('/penpals', (req, res) => {
    const userEmail = req.session.email; // Assuming session stores the email
    
    // Check the number of penpals
    const checkPenpalsQuery = `SELECT * FROM Penpals WHERE user1 = ? OR user2 = ?`;
    db.query(checkPenpalsQuery, [userEmail, userEmail], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error checking penpals');
        }

        if (result.length < 3) {
            // Create my_pals view
            const createMyPalsView = `
                CREATE VIEW my_pals AS
                SELECT y.email, MAX(y.num) - 1 AS counters
                FROM (SELECT COUNT(email) AS num, email 
                      FROM Interests
                      WHERE interest_name IN (SELECT interest_name FROM Interests WHERE email = ?)  
                        AND email <> ?
                      GROUP BY email) y
                GROUP BY email
                ORDER BY counters DESC
            `;
            db.query(createMyPalsView, [userEmail, userEmail], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Error creating my_pals view');
                }

                // Create potentials view
                const createPotentialsView = `
                    CREATE VIEW potentials AS
                    SELECT DISTINCT my_pals.email, my_pals.counters
                    FROM my_pals
                    NATURAL JOIN Languages
                    WHERE language IN (SELECT language FROM Languages WHERE email = ?)
                `;
                db.query(createPotentialsView, [userEmail], (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('Error creating potentials view');
                    }

                    // Create filtered view
                    const createFilteredView = `
                        CREATE VIEW filtered AS
                        SELECT * FROM potentials
                        WHERE !(email IN (SELECT user1 FROM Penpals WHERE user2 = ?)
                        OR email IN (SELECT user2 FROM Penpals WHERE user1 = ?))
                    `;
                    db.query(createFilteredView, [userEmail, userEmail], (err, result) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).send('Error creating filtered view');
                        }

                        // Fetch the best match
                        const fetchBestMatch = `
                            SELECT email FROM filtered
                            WHERE counters = (SELECT MAX(counters) FROM filtered)
                            LIMIT 1
                        `;
                        db.query(fetchBestMatch, (err, result) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).send('Error fetching best match');
                            }

                            if (result.length > 0) {
                                const matchedEmail = result[0].email;

                                // Insert penpal relationship
                                const insertPenpalQuery = `
                                    INSERT INTO Penpals (user1, user2)
                                    VALUES (?, ?)
                                `;
                                db.query(insertPenpalQuery, [userEmail, matchedEmail], (err, result) => {
                                    if (err) {
                                        console.error(err);
                                        return res.status(500).send('Error inserting penpal');
                                    }

                                    // Clean up views
                                    const dropViews = [
                                        'DROP VIEW my_pals',
                                        'DROP VIEW potentials',
                                        'DROP VIEW filtered'
                                    ];

                                    dropViews.forEach((query) => {
                                        db.query(query, (err, result) => {
                                            if (err) console.error(err);
                                        });
                                    });

                                    // Fetch all penpals for the user
                                    const fetchAllPenpals = `
                                        SELECT * FROM Penpals
                                        WHERE user1 = ? OR user2 = ?
                                    `;
                                    db.query(fetchAllPenpals, [userEmail, userEmail], (err, result) => {
                                        if (err) {
                                            console.error(err);
                                            return res.status(500).send('Error fetching penpals');
                                        }

                                        req.session.numOfPenpals = result.length;
                                        let i = 1;
                                        result.forEach((row) => {
                                            const palEmail = (row.user1 !== userEmail) ? row.user1 : row.user2;
                                            req.session[`pal_${i}`] = palEmail;
                                            i++;
                                        });

                                        // Redirect to dashboard after success
                                        res.redirect('/dashboard');
                                    });
                                });
                            } else {
                                console.log('No matching penpals found.');
                                res.send('hello bye');
                            }
                        });
                    });
                });
            });
        } else {
            // User already has 3 penpals
            res.redirect('/dashboard');
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
