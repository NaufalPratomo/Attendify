import mongoose from 'mongoose';

const HolidaySchema = new mongoose.Schema({
    date: { type: Date, required: true },
    dateString: { type: String, required: true }, // "YYYY-MM-DD" for timezone-safe queries
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['GLOBAL', 'PERSONAL'], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

// Compound unique index: prevents duplicate holidays per date/type/user
HolidaySchema.index({ dateString: 1, type: 1, userId: 1 }, { unique: true });



export default mongoose.models.Holiday || mongoose.model('Holiday', HolidaySchema);
