require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const connectDB = require("./db/connectDB");
const route_sites = require("./routes/route_sites");
const route_root = require("./routes/route_root");
const notFound = require("./routes/not_found");
var cookieParser = require("cookie-parser");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const { version } = require("./package.json");

// openapi documentation
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "OpenApi documentation",
      version,
    },
  },
  apis: ["./routes/*"],
};
const swaggerDocument = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/api-docs.json", (req, res) => {
  return res.status(200).json(swaggerDocument);
});

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_JWT_SECRET));
app.use(
  cors({
    origin: "*",
    // methods: ["GET", "POST", "DELETE", "PATCH"],
    // credentials: true,
  })
);

// routes
app.use("/", route_root);
app.use("/api/sites", route_sites);
app.use(notFound);

const start = async () => {
  try {
    await connectDB(process.env.MONGO_DB_URI);
    app.listen(process.env.PORT || 5000, async () => {
      await require("./controllers/children_cleanup").childrenCleanup();
      console.log("Cleanup done and server listening on port " + (process.env.PORT || 5000) + " ...");
    });
  } catch (error) {
    console.log(error);
  }
};

start();
