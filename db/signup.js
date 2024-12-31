const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/DBMS', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB!'))
    .catch(err => console.log('MongoDB connection error:', err));

// Define User schema
const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    phoneNo: String,
    password: String,
    date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: true
}));

// User Registration Route
app.post('/register', async (req, res) => {
    const { firstName, lastName, email, phoneNo, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            firstName,
            lastName,
            email,
            phoneNo,
            password: hashedPassword
        });

        await newUser.save();

        req.session.email = email;  // Save the email in the session
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error registering user');
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
