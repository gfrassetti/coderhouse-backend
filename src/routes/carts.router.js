import { Router } from "express";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cartsPath = path.join(__dirname, "../data/carrito.json");
console.log("cartsPath: ", cartsPath);
const cartsRouter = Router();

const readCarts = () => {
  try {
    const data = fs.readFileSync(cartsPath, "utf8");
    const carts = JSON.parse(data);
    if (!Array.isArray(carts)) {
      throw new Error("Carts data is not an array");
    }
    console.log("carts: ", carts);
    return carts;
  } catch (err) {
    console.error("Error reading carts file:", err);
    return [];
  }
};

const writeCarts = (carts) => {
  try {
    fs.writeFileSync(cartsPath, JSON.stringify(carts, null, 2));
  } catch (err) {
    console.error("Error writing carts file:", err);
  }
};

/* GET */
cartsRouter.get("/", (req, res) => {
  const carts = readCarts();
  console.log(req.body.products);
  if (carts.length === 0) {
    return res.status(200).send("No products available");
  }
  const limit = req.query.limit ? parseInt(req.query.limit) : carts.length;
  if (isNaN(limit) || limit < 1) {
    return res.status(400).send("Invalid limit value");
  } else {
    res.json(carts.slice(0, limit));
  }
});

/* GET id */
cartsRouter.get("/:cid", (req, res) => {
  const cartId = req.params.cid;
  const carts = readCarts();

  if (!Array.isArray(carts)) {
    console.error("Carts data is not an array");
    return res.status(500).send("Internal server error");
  }

  const cart = carts.find((c) => c.id === cartId);
  if (cart) {
    res.json(cart.products);
  } else {
    res.status(404).send("Cart not found");
  }
});

/* POST */
cartsRouter.post("/", (req, res) => {
  const carts = readCarts();

  const newCart = {
    id: uuidv4(),
    quantity: 1,
  };

  carts.push(newCart);
  writeCarts(carts);
  res.status(201).json(newCart);
  console.log(`Cart created: id: ${newCart.id}`);
});

cartsRouter.post("/:cid/product/:pid", (req, res) => {
  const { cid, pid } = req.params;

  const carts = readCarts();
  const cart = carts.find((cart) => cart.id === cid);

  if (!cart) {
    return res.status(404).send("Cart not found");
  }

  const product = cart.products.find((p) => p.id === pid);
  console.log("product: ", product);
  if (product) {
    product.quantity += 1;
    writeCarts(carts);
    res
      .status(200)
      .send(
        `Product already in cart: id: ${pid}, current quantity: ${product.quantity}`
      );
  } else {
    const newProduct = {
      id: pid,
      quantity: 1,
    };
    cart.products.push(newProduct);
    writeCarts(carts);
    console.log(carts);
  }
  res.status(201).json(product);
  console.log(`Product added to cart: id: ${pid}`);
});

cartsRouter.use((err, req, res, next) => {
  if (err) res.status(500).json({ message: err.message });
});

export { cartsRouter };
