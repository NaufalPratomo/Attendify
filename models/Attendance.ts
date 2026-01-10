import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date },
    status: { type: String, enum: ['Present', 'Late', 'Absent', 'Valid', 'Short'], default: 'Present' },
    durationMinutes: { type: Number, default: 0 },
    isManual: { type: Boolean, default: false },
    notes: { type: String },
}, { timestamps: true });

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
