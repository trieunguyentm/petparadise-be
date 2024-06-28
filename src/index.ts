import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import route from "./routes";
import morgan from "morgan";

dotenv.config();

const app = express();
const port = process.env.PORT || 9000;

/** Cors */
app.use(
  cors({
    origin: process.env.FE_URL || "http://localhost:3001",
    credentials: true,
  })
);

/** Config Express use body-parser and cookie-parser */
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(morgan("tiny"));

/** Route */
app.use("/api", route);

/** Run the server */
try {
  app.listen(port, () => {
    console.log(`Server is running in: http://localhost:${port}`);
  });
} catch (error) {
  console.log(`Error when run server: ${error}`);
}
