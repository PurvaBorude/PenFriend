// server.js or app.js
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const Penpal = require('./models/Penpals'); // MongoDB schema for Penpals
const Route = require('./models/Route'); // MongoDB schema for Route
const Message = require('./models/Messages'); // MongoDB schema for Messages

const app = express();
const port = 5000;

// Middleware
app.use(express.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/DBMS', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Route for sending messages
app.get('/send-message', async (req, res) => {
    const email = req.session.email;  // Assuming email is stored in session
    let receiver = req.session.recievers;
    const context = req.query.Message;  // The message content

    if (req.query.Sends1 == 1) receiver = req.session.pal_1;
    if (req.query.Sends2 == 2) receiver = req.session.pal_2;
    if (req.query.Sends3 == 3) receiver = req.session.pal_3;
    if (req.query.Sends4 == 4) receiver = req.session.pal_4;

    try {
        // Find pen_id by matching users
        let penpal = await Penpal.findOne({
            $or: [
                { user1: email, user2: receiver },
                { user2: email, user1: receiver }
            ]
        });

        if (!penpal) {
            return res.status(404).send('Penpal not found');
        }

        let route = await Route.findOne({ pen_id: penpal._id, sender: email });

        // If no route exists, create a new route
        if (!route) {
            route = new Route({
                pen_id: penpal._id,
                sender: email
            });
            await route.save();
        }

        // Create a new message
        const message = new Message({
            route: route._id,
            content: context
        });

        await message.save();

        res.redirect('http://localhost:3000/dashboard');  // Redirect to dashboard (your React frontend)
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
