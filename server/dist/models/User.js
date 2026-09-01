"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const constants_1 = require("../config/constants");
const userSchema = new mongoose_1.Schema({
    merchantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
        type: String,
        enum: Object.values(constants_1.ROLES),
        default: constants_1.ROLES.ANALYST,
    },
    lastLoginAt: Date,
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ merchantId: 1 });
userSchema.methods.comparePassword = async function (password) {
    return bcryptjs_1.default.compare(password, this.passwordHash);
};
// Never return passwordHash in queries by default
userSchema.set('toJSON', {
    transform: (_doc, ret) => {
        delete ret.passwordHash;
        return ret;
    },
});
exports.User = (0, mongoose_1.model)('User', userSchema);
//# sourceMappingURL=User.js.map