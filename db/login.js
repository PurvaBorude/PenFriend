const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session setup
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/DBMS', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB')).catch(err => console.log(err));

// MongoDB Schemas
const UserSchema = new mongoose.Schema({
    email: String,
    password: String,
    name: String
});

const PenpalSchema = new mongoose.Schema({
    user1: String,
    user2: String
});

const User = mongoose.model('User', UserSchema);
const Penpal = mongoose.model('Penpal', PenpalSchema);

// Route to handle login logic
app.post('/login', async (req, res) => {
    const { email2, pw2, remember } = req.body;

    // Check if user exists and password matches
    const user = await User.findOne({ email: email2, password: pw2 });

    if (user) {
        // Set session variables
        req.session.logged_in = true;
        req.session.username = user.name;
        req.session.email = email2;
        req.session.user_pw = pw2;

        // Set cookies if "remember" is checked
        if (remember) {
            res.cookie('email2', email2, { maxAge: 3600000 });  // 1 hour
            res.cookie('pw2', pw2, { maxAge: 3600000 });  // 1 hour
        }

        // Get penpals for the user
        const penpals = await Penpal.find({ $or: [{ user1: email2 }, { user2: email2 }] });
        req.session.numOfPenpals = penpals.length;

        let i = 1;
        penpals.forEach(penpal => {
            req.session[`penpal_id_${i}`] = penpal._id;
            req.session[`pal_${i}`] = penpal.user1 === email2 ? penpal.user2 : penpal.user1;
            i++;
        });

        // Redirect to dashboard
        return res.redirect('/dashboard');
    }

    // Redirect to login page if user doesn't exist
    res.redirect('/');
});

// Route to handle dashboard
app.get('/dashboard', (req, res) => {
    if (req.session.logged_in) {
        res.send(`Welcome ${req.session.username}, you have ${req.session.numOfPenpals} penpals.`);
    } else {
        res.redirect('/');
    }
});

// Route to handle index (login page)
app.get('/', (req, res) => {
    res.send('<form method="POST" action="/login">Email: <input type="email" name="email2"><br>Password: <input type="password" name="pw2"><br><input type="checkbox" name="remember"> Remember Me<br><input type="submit" value="Login"></form>');
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
