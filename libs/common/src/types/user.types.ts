export interface IUser {
    id: string;
    username: string;
    email: string;
    displayName?: string;
    profilePictureUrl?: string;
    lastSeen?: Date;
    createdAt: Date;
}

export interface IUserPayload {
    userId: string;
    username: string;
    email: string;
}

export interface IAuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface IAuthResponse {
    user: IUser;
    tokens: IAuthTokens;
}