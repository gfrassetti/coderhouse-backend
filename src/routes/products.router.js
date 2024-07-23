import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const productsPath = path.join(__dirname, "../data/products.json");
const productsRouter = Router();

const readProducts = () => {
  try {
    const data = fs.readFileSync(productsPath, "utf8");
    return JSON.parse(data) || [];
  } catch (err) {
    console.error("Error reading products file:", err);
    return [];
  }
};

const writeProducts = (products) => {
  try {
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
  } catch (err) {
    console.error("Error writing products file:", err);
  }
};

/* GET */
productsRouter.get("/", (req, res) => {
  const products = readProducts();
  if (products.length === 0) {
    return res.status(200).send("No products available");
  }
  const limit = req.query.limit ? parseInt(req.query.limit) : products.length;
  if (isNaN(limit) || limit < 1) {
    return res.status(400).send("Invalid limit value");
  } else {
    res.json(products.slice(0, limit));
  }
});

/* GET id */
productsRouter.get("/:pid", (req, res) => {
  const productId = req.params.pid;
  const products = readProducts();
  const product = products.find((p) => p.id === productId);
  if (product) {
    res.json(product);
  } else {
    res.status(404).send("Product not found");
  }
});

/* POST */
productsRouter.post("/", (req, res) => {
  const products = readProducts();
  const { title, description, code, price } = req.body;
  if (!title || !description || !code || !price) {
    return res.status(400).send("Missing required fields");
  }
  const newProduct = {
    id: uuidv4(),
    title,
    description,
    code,
    price,
    status: true,
    stock: 10,
    category: "Category 1",
    thumbnails: [],
  };

  products.push(newProduct);
  writeProducts(products);
  req.app.get("io").emit("products", products);
  res.status(201).json(newProduct);
});

/* PUT */
productsRouter.put("/:pid", (req, res) => {
  const productId = req.params.pid;
  const products = readProducts();
  const { title, description, code, price, status, stock, category } = req.body;
  const product = products.find((p) => p.id === productId);
  if (!product) {
    return res.status(404).send("Product not found");
  }
  if (
    title === undefined ||
    description === undefined ||
    code === undefined ||
    price === undefined ||
    status === undefined ||
    stock === undefined ||
    category === undefined
  ) {
    return res.status(400).send("Missing required fields");
  }
  product.title = title;
  product.description = description;
  product.code = code;
  product.price = price;
  product.status = status;
  product.stock = stock;
  product.category = category;
  writeProducts(products);
  res.json(product);
});

/* DELETE */
productsRouter.delete("/:pid", (req, res) => {
  const productId = req.params.pid;
  let products = readProducts();
  const productIndex = products.findIndex((p) => p.id === productId);
  if (productIndex === -1) {
    return res.status(404).send("Product not found");
  }
  const deletedProduct = products.splice(productIndex, 1);
  writeProducts(products);
  req.app.get("io").emit("products", products);
  res.status(202).send(`Product ${productId} deleted: ${deletedProduct}`);
});

productsRouter.use((err, req, res, next) => {
  if (err) res.status(500).json({ message: err.message });
});

export { productsRouter };
