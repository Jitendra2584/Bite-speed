import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './data-source';

dotenv.config();

console.log('Bite speed Identity Service is starting...',process.env.DB_USER);

const app = express();
const PORT = process.env.PORT ?? 3000;

// Middleware
app.use(cors());
app.use(express.json());

AppDataSource.initialize().then(() => {
    // Routes
app.get('/', (req, res) => {
  res.json({ message: 'Bite speed Identity Service is running!' });
});

app.post('/identify', (req, res) => {
  // TODO: Implement identity logic
  res.json({ message: 'Identity endpoint coming soon...' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
}).catch((error) => {
  console.error('Error during Data Source initialization:', error);})
