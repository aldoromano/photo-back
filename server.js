const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

require("dotenv").config();

const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI);

const routePhoto = require("./routes/photo");
const routeClassifiedPhoto = require("./routes/classified_photo");

app.use(routePhoto);
app.use(routeClassifiedPhoto);

app.all("*", (req, res) => {
  res.status(404).json({ message: "Page not found" });
});

app.listen(process.env.PORT, () => {
  console.log("Server photos started on port ", process.env.PORT);
});
