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
const InterestSchema = new mongoose.Schema({
    email: String,
    interest_name: String
});

const LanguageSchema = new mongoose.Schema({
    email: String,
    language: String
});

const PenpalSchema = new mongoose.Schema({
    user1: String,
    user2: String
});

const Interest = mongoose.model('Interest', InterestSchema);
const Language = mongoose.model('Language', LanguageSchema);
const Penpal = mongoose.model('Penpal', PenpalSchema);

// Route to handle the logic
app.get('/create-penpal', async (req, res) => {
    const userEmail = req.session.email;

    // Check the existing penpals
    const existingPenpals = await Penpal.find({
        $or: [{ user1: userEmail }, { user2: userEmail }]
    });

    if (existingPenpals.length < 3) {
        // Create "my_pals" equivalent: Get users with common interests
        const interests = await Interest.find({ email: userEmail });

        const potentialPals = await Interest.aggregate([
            {
                $match: {
                    interest_name: { $in: interests.map(i => i.interest_name) },
                    email: { $ne: userEmail }
                }
            },
            {
                $group: {
                    _id: '$email',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Create "potentials" equivalent: Users with common languages
        const languages = await Language.find({ email: userEmail });

        const filteredPals = await Language.aggregate([
            {
                $match: {
                    language: { $in: languages.map(l => l.language) }
                }
            },
            {
                $lookup: {
                    from: 'interests',
                    localField: 'email',
                    foreignField: 'email',
                    as: 'interests'
                }
            },
            {
                $match: {
                    'interests.email': { $nin: existingPenpals.map(p => p.user1) }
                }
            }
        ]);

        if (filteredPals.length > 0) {
            const newPenpal = filteredPals[0]; // Taking the first one as per your logic
            const newPenpalEntry = new Penpal({
                user1: userEmail,
                user2: newPenpal.email
            });

            await newPenpalEntry.save();
        } else {
            console.log('No potential penpals found');
        }

        // Update session with penpal info
        req.session.numOfPenpals = existingPenpals.length;
        let i = 1;
        for (const penpal of existingPenpals) {
            if (penpal.user1 !== userEmail) {
                req.session[`pal_${i}`] = penpal.user1;
            } else {
                req.session[`pal_${i}`] = penpal.user2;
            }
            i++;
        }
    }

    res.redirect('/dashboard');
});

// Dashboard route (for demonstration)
app.get('/dashboard', (req, res) => {
    res.send(`You have ${req.session.numOfPenpals} penpals.`);
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
