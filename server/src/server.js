import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/db.js';

const port = Number(process.env.PORT) || 5000;

try {
  await connectDatabase();
  const server = app.listen(port, () => console.log(`Shortly API listening on http://localhost:${port}`));
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Stop the existing Shortly server before starting another one.`);
      process.exitCode = 1;
      return;
    }
    console.error(`Unable to start API server: ${error.message}`);
    process.exitCode = 1;
  });
} catch (error) {
  console.error(`Unable to start server: ${error.message}`);
  process.exit(1);
}
