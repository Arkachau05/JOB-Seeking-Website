import app from "./app.js";
import cloudinary from "cloudinary";

const port = process.env.PORT || 4000;

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
  api_key: process.env.CLOUDINARY_CLIENT_API,
  api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running at port ${port}`);
});
