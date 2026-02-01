import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    phone: string;
    name: string;
    email?: string;
    password?: string; // Hashed password
    preferredCrop?: string; // Preferred crop for alerts
    location?: {
        state: string;
        district: string;
        mandi: string;
    };
    registrationMarketData?: {
        state?: string;
        district?: string;
        minPrice: number;
        maxPrice: number;
        modalPrice: number;
        mandiName: string;
        commodity: string;
        fetchedAt: Date;
    };
    otp?: string; // OTP for phone verification
    otpExpiry?: Date;
    authToken?: string; // Simple auth token
    authTokenExpiry?: Date; // Token expiry date
    isPhoneVerified: boolean;
    isEmailVerified?: boolean;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema({
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true,
        match: [/^[0-9]{10}$/, 'Phone must be 10 digits'],
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        sparse: true,
    },
    password: {
        type: String,
        minlength: 8,
        select: false, // Don't include password by default in queries
    },
    preferredCrop: {
        type: String,
        trim: true,
    },
    location: {
        state: String,
        district: String,
        mandi: String,
    },
    otp: {
        type: String,
        select: false,
    },
    otpExpiry: {
        type: Date,
        select: false,
    },
    authToken: {
        type: String,
        select: false,
    },
    authTokenExpiry: {
        type: Date,
        select: false,
    },
    isPhoneVerified: {
        type: Boolean,
        default: false,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
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

// Hash password before saving
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    if (!this.password) return false;
    return await bcrypt.compare(password, this.password);
};

// Validate password strength (8+ chars, mix of letters and numbers)
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
    if (!password || password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters' };
    }
    if (!/[a-zA-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain letters' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain numbers' };
    }
    return { valid: true };
}

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
