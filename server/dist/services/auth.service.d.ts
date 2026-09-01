import { User } from '../models/User';
import { Merchant } from '../models/Merchant';
export interface RegisterInput {
    businessName: string;
    email: string;
    password: string;
    name: string;
    phone?: string;
}
export interface LoginInput {
    email: string;
    password: string;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export declare const authService: {
    register(input: RegisterInput): Promise<{
        user: InstanceType<typeof User>;
        merchant: InstanceType<typeof Merchant>;
        tokens: AuthTokens;
    }>;
    login(input: LoginInput): Promise<{
        user: InstanceType<typeof User>;
        tokens: AuthTokens;
    }>;
    refreshTokens(refreshToken: string): Promise<AuthTokens>;
};
//# sourceMappingURL=auth.service.d.ts.map