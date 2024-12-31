const express = require('express');
const session = require('express-session');

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

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Failed to log out');
        }

        // Redirect to login page after session destruction
        res.redirect('/');
    });
});

// Route to handle index (login page)
app.get('/', (req, res) => {
    if (req.session.logged_in) {
        res.send(`Welcome ${req.session.username}! <a href="/logout">Logout</a>`);
    } else {
        res.send('<form method="POST" action="/login">Email: <input type="email" name="email2"><br>Password: <input type="password" name="pw2"><br><input type="checkbox" name="remember"> Remember Me<br><input type="submit" value="Login"></form>');
    }
});

// Add other routes as necessary, such as for login

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
