const express = require('express');
const session = require('express-session');

const app = express();
const port = 3000;

// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

// Route to handle logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session: ', err);
            return res.status(500).send('Internal Server Error');
        }
        // Redirect to the homepage or login page after logout
        res.redirect('/');
    });
});

// Placeholder home route
app.get('/', (req, res) => {
    res.send('Welcome to the Pen Friend App. Please log in.');
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
