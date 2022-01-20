require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const connectDB = require("./db/connectDB");
const route_sites = require("./routes/route_sites");
const route_root = require("./routes/route_root");
const notFound = require("./routes/not_found");
const cookieSession = require("cookie-session");

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  cookieSession({
    name: "app_session",
    secret: process.env.COOKIE_SECRET,
  })
);
app.use(
  cors({
    origin: "*",
    // methods: ["GET", "POST", "DELETE", "PATCH"],
    credentials: true,
  })
);

// routes
app.use("/", route_root);
app.use("/api/sites", route_sites);
app.use(notFound);

const start = async () => {
  try {
    await connectDB(process.env.MONGO_DB_URI);
    app.listen(process.env.PORT || 5000, console.log("Server is on ..."));
  } catch (error) {
    console.log(error);
  }
};

start();
