
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Model
const UserSchema = new mongoose.Schema({
    email: String,
    role: String,
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function setAdmin() {
    const args = process.argv.slice(2);
    const email = args[0];

    if (!email) {
        console.error('Usage: node scripts/setAdmin.js <email>');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const user = await User.findOne({ email });
        if (!user) {
            console.error('User not found!');
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();
        console.log(`✅ User ${email} promoted to ADMIN.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

setAdmin();
