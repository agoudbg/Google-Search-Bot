import dotenv from 'dotenv';

dotenv.config();

const env = {
    botToken: process.env.BOT_TOKEN as string,
};

export default env;
