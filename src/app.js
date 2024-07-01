import express from "express";
import { productsRouter } from "./routes/products.router.js";
import { cartsRouter } from "./routes/carts.router.js";

const app = express();
/* middlewares */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);

app.listen(8080, () => {
  console.log("Server running on port 8080");
});

app.get("/", (req, res) => {
  res.send("Home");
});
