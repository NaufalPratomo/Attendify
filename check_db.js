const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://naufalpratomo8_db_user:0SasUTW8DSyQN4tJ@cluster0.ejdmjbm.mongodb.net/attendify?appName=Cluster0";

const LogbookSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    activity: { type: String, required: true },
    attachmentUrl: { type: String },
    attachmentName: { type: String },
}, { timestamps: true });

const Logbook = mongoose.models.Logbook || mongoose.model('Logbook', LogbookSchema);

async function checkLogs() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to DB");

        const logs = await Logbook.find().sort({ createdAt: -1 }).limit(1);
        if (logs.length > 0) {
            const log = logs[0];
            console.log(`Reverting log ${log._id}...`);
            log.attachmentUrl = undefined;
            log.attachmentName = undefined;
            await log.save();
            console.log("Log reverted.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

checkLogs();
