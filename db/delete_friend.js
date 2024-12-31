const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');

const app = express();

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    username: String
});

const PenpalSchema = new mongoose.Schema({
    user1: String,
    user2: String
});

const RouteSchema = new mongoose.Schema({
    pen_id: mongoose.Schema.Types.ObjectId,
    user1: String,
    user2: String
});

const User = mongoose.model('User', UserSchema);
const Penpal = mongoose.model('Penpal', PenpalSchema);
const Route = mongoose.model('Route', RouteSchema);

// Route to handle delete penpal logic
app.get('/delete-penpal', async (req, res) => {
    const userEmail = req.session.email;
    const password = req.query.confirm_delete;
    const buttonNumber = req.query.button1 || req.query.button2 || req.query.button3 || req.query.button4;
    const palIndex = `pal_${buttonNumber}`;
    const bye = req.session[palIndex];

    const user = await User.findOne({ email: userEmail, password: password });

    if (user) {
        // Delete Route and Penpal entries
        await Route.deleteMany({
            pen_id: { $in: await Penpal.aggregate([
                { $match: { $or: [{ user1: userEmail, user2: bye }, { user1: bye, user2: userEmail }] } },
                { $project: { pen_id: 1 } }
            ]) }
        });

        await Penpal.deleteMany({
            $or: [{ user1: userEmail, user2: bye }, { user1: bye, user2: userEmail }]
        });
    }

    // Update the session with the remaining penpals
    const penpals = await Penpal.find({
        $or: [{ user1: userEmail }, { user2: userEmail }]
    });

    req.session.numOfPenpals = penpals.length;

    let i = 1;
    penpals.forEach(penpal => {
        if (penpal.user1 !== userEmail) {
            req.session[`pal_${i}`] = penpal.user1;
        } else {
            req.session[`pal_${i}`] = penpal.user2;
        }
        i++;
    });

    res.redirect('/dashboard');
});

// Dashboard route (for demonstration)
app.get('/dashboard', (req, res) => {
    res.send(`You have ${req.session.numOfPenpals} penpals.`);
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
