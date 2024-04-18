import PusherServer from "pusher";
import dotenv from "dotenv";

dotenv.config();

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID as string,
  key: process.env.PUSHER_APP_KEY as string,
  secret: process.env.PUSHER_SECRET as string,
  cluster: "ap1",
  useTLS: true,
});
