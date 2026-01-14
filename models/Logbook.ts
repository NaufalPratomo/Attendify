import mongoose from 'mongoose';

const LogbookSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true }, // We will store the date of the log (e.g., T00:00:00.000Z)
    activity: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.Logbook || mongoose.model('Logbook', LogbookSchema);
