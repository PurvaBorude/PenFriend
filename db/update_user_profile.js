const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
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
    password: String
});

const User = mongoose.model('User', userSchema);

// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: true
}));

// Update User Route
app.post('/updateUser', async (req, res) => {
    const { firstName, lastName, phoneNo, password } = req.body;
    const email = req.session.email;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Update user fields
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.phoneNo = phoneNo || user.phoneNo;
        if (password) {
            user.password = await bcrypt.hash(password, 10);  // Hash new password if provided
        }

        await user.save();
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating user information');
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
