import express from "express";
import { productsRouter } from "./routes/products.router.js";
import { cartsRouter } from "./routes/carts.router.js";
import { engine } from "express-handlebars";
import { Server } from "socket.io";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { Product } from "./models/product.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

const mongoURI =
  "mongodb+srv://guidofrassetti:jUjDrphWxTCQuolK@coderhousebackend.1wp1h.mongodb.net/?retryWrites=true&w=majority&appName=CoderhouseBackend";
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB Atlas:", error);
  });

//views
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

// Rutas API
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);

app.get("/", async (req, res) => {
  try {
    const products = await Product.find().lean();
    res.render("home", { products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Internal server error");
  }
});

app.get("/realtimeproducts", async (req, res) => {
  try {
    const products = await Product.find().lean();
    res.render("realTimeProducts", { products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Internal server error");
  }
});

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.emit("products", async () => {
    const products = await Product.find().lean();
    return products;
  });

  socket.on("addProduct", async (productData) => {
    try {
      const newProduct = new Product(productData);
      await newProduct.save();
      const products = await Product.find().lean();
      io.emit("products", products);
    } catch (error) {
      console.error("Error adding product:", error);
    }
  });

  socket.on("deleteProduct", async (productId) => {
    try {
      await Product.findByIdAndDelete(productId);
      const products = await Product.find().lean();
      io.emit("products", products);
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

server.listen(8080, () => {
  console.log("Server running on port 8080");
});
