import { Document, Types } from 'mongoose';
import { ROLES } from '../config/constants';
export type UserRole = keyof typeof ROLES;
export interface IUser extends Document {
    merchantId: Types.ObjectId;
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    lastLoginAt?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(password: string): Promise<boolean>;
}
export declare const User: import("mongoose").Model<IUser, {}, {}, {}, Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=User.d.ts.map