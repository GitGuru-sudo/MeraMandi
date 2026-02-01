import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAlert extends Document {
    user: mongoose.Types.ObjectId;
    state: string;
    district: string;
    mandi: string;
    commodity: string;
    targetPrice: number;
    isActive: boolean;
    schedules: {
        day: string; // 'Monday', 'Tuesday', ..., 'Everyday'
        time: string; // 'HH:mm'
    }[];
    email?: string;
    cachedMin?: number;
    cachedMax?: number;
    cachedModal?: number;
    cachedMandi?: string;
    lastNotifiedAt?: Date;
    createdAt: Date;
}

const AlertSchema: Schema<IAlert> = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    state: {
        type: String,
        required: true,
        uppercase: true,
    },
    district: {
        type: String,
        required: true,
        uppercase: true,
    },
    mandi: {
        type: String,
        required: true,
        uppercase: true,
    },
    commodity: {
        type: String,
        required: true,
        uppercase: true,
    },
    targetPrice: {
        type: Number,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    schedules: [{
        day: { type: String, required: true },
        time: { type: String, required: true }
    }],
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    cachedMin: Number,
    cachedMax: Number,
    cachedModal: Number,
    cachedMandi: String,
    lastNotifiedAt: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Index for efficient querying by location and crop
AlertSchema.index({ state: 1, district: 1, mandi: 1, commodity: 1 });

const Alert: Model<IAlert> = mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);

export default Alert;
