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

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);

// Home
app.get("/", async (req, res) => {
  try {
    const { limit = 5, page = 1, sort, query } = req.query;
    const options = {
      limit: parseInt(limit),
      page: parseInt(page),
      sort: sort ? { price: sort } : {},
    };
    const filter = query
      ? { $or: [{ category: query }, { available: query }] }
      : {};

    const products = await Product.paginate(filter, options);
    res.render("home", {
      products: products.docs,
      pagination: {
        page: products.page,
        totalPages: products.totalPages,
        hasNextPage: products.hasNextPage,
        hasPrevPage: products.hasPrevPage,
        nextPage: products.nextPage,
        prevPage: products.prevPage,
      },
    });
  } catch (error) {
    console.error("Error retrieving products:", error);
    res.status(500).send("Error retrieving products");
  }
});

// RealTime Products
app.get("/realtimeproducts", async (req, res) => {
  const products = await Product.find().lean();
  res.render("realTimeProducts", { products });
});

io.on("connection", async (socket) => {
  console.log("New client connected");

  socket.emit("products", await Product.find().lean());

  socket.on("addProduct", async (productData) => {
    const newProduct = new Product(productData);
    await newProduct.save();
    io.emit("products", await Product.find().lean());
  });

  socket.on("deleteProduct", async (productId) => {
    await Product.findByIdAndDelete(productId);
    io.emit("products", await Product.find().lean());
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

server.listen(8080, () => {
  console.log("Server running on port 8080");
});
