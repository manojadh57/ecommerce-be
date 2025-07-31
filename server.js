import "dotenv/config";
import app from "./app.js";
import connectMongoDB from "./src/config/mongodbConfig.js";

const PORT = process.env.PORT || 4000;

///mongoDB connection/
connectMongoDB()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Server ready at http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.log(err);
    console.log("DB connection error");
  });
