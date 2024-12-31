// server.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const User = require('./models/User');  // MongoDB User model
const Interest = require('./models/Interest');  // MongoDB Interest model
const Language = require('./models/Language');  // MongoDB Language model

const app = express();
const port = 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/DBMS', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Route for user registration
app.post('/register', async (req, res) => {
    const { name, email, pw } = req.body;

    try {
        // Check if user already exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).send('User already exists');
        }

        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(pw, 10);

        // Create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();

        // Create default entries for Interests and Languages
        const newInterest = new Interest({ email });
        await newInterest.save();

        const newLanguage = new Language({ email });
        await newLanguage.save();

        // Set session variables
        req.session.logged_in = true;
        req.session.username = name;
        req.session.email = email;
        req.session.user_pw = hashedPassword;

        res.redirect('http://localhost:3000/home');  // Redirect to home page (React frontend)

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
