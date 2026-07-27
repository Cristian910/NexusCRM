import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  // Used to build absolute links in emails (e.g. the password-reset URL).
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
}));
