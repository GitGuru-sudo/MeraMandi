import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    phone: string;
    name: string;
    location?: {
        state: string;
        district: string;
    };
    createdAt: Date;
}

const UserSchema: Schema<IUser> = new Schema({
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true,
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    location: {
        state: String,
        district: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
