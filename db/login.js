const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/penpalDB', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('Error connecting to MongoDB:', err));

// User and Penpal Models
const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: String,
    password: String,
}));

const Penpal = mongoose.model('Penpal', new mongoose.Schema({
    user1: String,
    user2: String,
}));

// Login Route
app.post('/login', async (req, res) => {
    const { email, pw, remember } = req.body;

    // Find user by email and password
    const user = await User.findOne({ email, password: pw });

    if (user) {
        // Set session variables
        req.session.logged_in = true;
        req.session.username = user.name;
        req.session.email = email;
        req.session.user_pw = pw;

        // Handle remember me (cookies)
        if (remember) {
            res.cookie('email', email, { maxAge: 3600000 }); // 1 hour
            res.cookie('password', pw, { maxAge: 3600000 });
        }

        // Fetch penpal data
        const penpals = await Penpal.find({ $or: [{ user1: email }, { user2: email }] });

        req.session.numOfPenpals = penpals.length;

        penpals.forEach((penpal, index) => {
            req.session[`penpal_id_${index + 1}`] = penpal._id;
            req.session[`pal_${index + 1}`] = penpal.user1 === email ? penpal.user2 : penpal.user1;
        });

        // Redirect to dashboard
        return res.redirect('/dashboard');
    } else {
        return res.redirect('/login');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
