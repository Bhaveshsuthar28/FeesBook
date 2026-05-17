import app from "./app.js";

import { env } from "./src/cors/config/env.js";

const startServer = async () => {
    try {
        await app.listen({
            port: env.PORT,
            host: "0.0.0.0",
        });

        console.log(`Server running on port ${env.PORT}`);
    } catch (error) {
        app.log.error(error);

        process.exit(1);
    }
};

startServer();