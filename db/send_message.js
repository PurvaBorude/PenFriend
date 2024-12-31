const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const app = express();
const port = 3000;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/DBMS', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB!'))
    .catch(err => console.log('MongoDB connection error:', err));

// Define User, Penpals, Route, and Messages schemas
const messageSchema = new mongoose.Schema({
    route: String,
    content: String
});

const Message = mongoose.model('Message', messageSchema);

app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: true
}));

// Send Message Route
app.post('/sendMessage', async (req, res) => {
    const senderEmail = req.session.email;
    const receiverEmail = req.body.receiverEmail;
    const messageContent = req.body.messageContent;

    try {
        const penpal = await Penpal.findOne({
            $or: [
                { user1: senderEmail, user2: receiverEmail },
                { user1: receiverEmail, user2: senderEmail }
            ]
        });

        if (!penpal) {
            return res.status(404).send('No penpal relationship found');
        }

        const route = await Route.findOne({ pen_id: penpal._id, sender: senderEmail });
        if (!route) {
            const newRoute = new Route({ pen_id: penpal._id, sender: senderEmail });
            await newRoute.save();
        }

        const newMessage = new Message({
            route: route.route,
            content: messageContent
        });

        await newMessage.save();

        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error sending message');
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
