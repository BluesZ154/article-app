import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import path from 'path';
import { fileURLToPath } from 'url';
import cors from "cors";
import morgan from "morgan";
import postsRouter from './routes/posts.js';
import {SendEmail} from './controllers/auth.js';

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cookieParser());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', postsRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
});

mongoose.connect("mongodb+srv://alihuang154_db_user:g2rv1LrG0VI1sz9A@cluster0c.fuau7xt.mongodb.net/Article-app?retryWrites=true&w=majority&appName=Cluster0c")
.then(() => {
  console.log('Connected to Voting Database');
  app.listen(4500, () => {
    console.log('Server is Running');
  })
})
.catch(() => {
  console.log('Connection Failed')
})