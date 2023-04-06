export const envBool = (env: string, fallback: boolean = undefined) => process.env[env] ? Boolean(parseInt(process.env[env], 10)) : fallback;
export const envInt = (env: string, fallback: number = undefined) => process.env[env] ? parseInt(process.env[env], 10) : fallback;
export const envString = (env: string, fallback: string = undefined) => process.env[env] ? process.env[env] : fallback;

export const envIsDev = process.env.NODE_ENV === 'development';
