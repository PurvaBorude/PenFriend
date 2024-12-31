const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const app = express();
const port = 3000;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/DBMS', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB!'))
    .catch(err => console.log('MongoDB connection error:', err));

// Define User schema
const userSchema = new mongoose.Schema({
    email: String,
    name: String,
    password: String,
    interests: [String]
});

const User = mongoose.model('User', userSchema);

app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: true
}));

// Update Interests Route
app.post('/updateInterest', async (req, res) => {
    const email = req.session.email;
    const updatedInterests = req.body.interest; // assuming interests are passed as an array

    if (!updatedInterests || updatedInterests.length === 0) {
        return res.status(400).send('No interests selected');
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Update the interests array
        user.interests = updatedInterests;
        await user.save();

        console.log(`Updated interests for ${email}: ${updatedInterests.join(', ')}`);
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating interests');
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
