import "dotenv/config";
import app from "./app.js";
import connectMongoDB from "./src/config/mongodbConfig.js";

// dotenv.config();

const PORT = process.env.PORT || 4000;

// Connect DB then start server
connectMongoDB()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Server ready at http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("DB connection error:", err);
  });
