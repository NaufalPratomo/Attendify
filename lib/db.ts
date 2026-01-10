import mongoose from 'mongoose';


interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

let cached: MongooseCache = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        let MONGODB_URI: string = process.env.MONGODB_URI || '';

        if (!MONGODB_URI || MONGODB_URI.includes('username:password')) {
            console.warn("Invalid or missing MONGODB_URI in .env, falling back to local MongoDB.");
            MONGODB_URI = 'mongodb://127.0.0.1:27017/attendify';
        }

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            return mongoose;
        });
    }
    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error("❌ MONGODB CONNECTION ERROR: Could not connect to database.");
        console.error("Please ensure MongoDB is installed and running, or update MONGODB_URI in your .env file.");
        console.error("Error details:", e);
        throw e;
    }

    return cached.conn;
}

export default connectToDatabase;
