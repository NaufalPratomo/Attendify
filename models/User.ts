import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    monthlyTargetBase: { type: Number, default: 11240 }, // Default target
    yearlyTarget: { type: Number, default: 134880 }, // Default target
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
