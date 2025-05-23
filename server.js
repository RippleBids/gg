js const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();
const app = express();
app.use(cors());
app.use(express.json());
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));
const contributionSchema = new mongoose.Schema({
    walletAddress: String,
    xrpAmount: Number,
    transactionId: String,
    email: String,
    timestamp: { type: Date, default: Date.now }
});
const Contribution = mongoose.model('Contribution', contributionSchema);
const transporter = nodemailer.createTransport({
    service: 'Outlook',
    auth: { user: 'ripplebids@outlook.com', pass: process.env.EMAIL_PASSWORD }
});
app.get('/api/contributions', async (req, res) => {
    try {
        const contributions = await Contribution.find();
        const totalXRP = contributions.reduce((sum, c) => sum + c.xrpAmount, 0);
        res.json({ contributions, totalXRP });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch contributions' });
    }
});
app.post('/api/contribute', async (req, res) => {
    try {
        const { walletAddress, xrpAmount, transactionId, email } = req.body;
        if (!walletAddress || !xrpAmount || !transactionId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const contribution = new Contribution({ walletAddress, xrpAmount, transactionId, email });
        await contribution.save();
        const mailOptions = {
            from: 'ripplebids@outlook.com',
            to: 'ripplebids@outlook.com',
            subject: 'New Contribution',
            text: `Wallet: ${walletAddress}\nXRP: ${xrpAmount}\nTransaction ID: ${transactionId}\nEmail: ${email || 'Not provided'}`
        };
        await transporter.sendMail(mailOptions);
        res.json({ message: 'Contribution recorded' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to record contribution' });
    }
});
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const mailOptions = {
            from: 'ripplebids@outlook.com',
            to: 'ripplebids@outlook.com',
            subject: `Contact Form: ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
        };
        await transporter.sendMail(mailOptions);
        res.json({ message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
});
app.post('/api/subscribe', async (req, res) => {
    try {
        const { email, walletAddress, xrpAmount } = req.body;
        if (!email || !walletAddress || !xrpAmount) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const mailOptions = {
            from: 'ripplebids@outlook.com',
            to: 'ripplebids@outlook.com',
            subject: 'New Subscriber',
            text: `Email: ${email}\nWallet: ${walletAddress}\nXRP Contributed: ${xrpAmount}`
        };
        await transporter.sendMail(mailOptions);
        res.json({ message: 'Subscription recorded' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to record subscription' });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
