import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICallSession extends Document {
    callSid: string;
    from?: string;
    step?: string;
    name?: string;
    email?: string;
    state?: string;
    district?: string;
    mandi?: string;
    preferredCrop?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CallSessionSchema: Schema<ICallSession> = new Schema({
    callSid: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    from: {
        type: String,
        trim: true,
    },
    step: {
        type: String,
        trim: true,
    },
    name: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    state: {
        type: String,
        trim: true,
    },
    district: {
        type: String,
        trim: true,
    },
    mandi: {
        type: String,
        trim: true,
    },
    preferredCrop: {
        type: String,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

CallSessionSchema.pre('save', function () {
    this.updatedAt = new Date();
});

const CallSession: Model<ICallSession> = mongoose.models.CallSession || mongoose.model<ICallSession>('CallSession', CallSessionSchema);

export default CallSession;
