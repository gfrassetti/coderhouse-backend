import { Router } from "express";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";

const cartsRouter = Router();

/* GET all */
cartsRouter.get("/", async (req, res) => {
  try {
    const carts = await Cart.find();
    if (carts.length === 0) {
      return res.status(200).send("No carts available");
    }
    const limit = req.query.limit ? parseInt(req.query.limit) : carts.length;
    if (isNaN(limit) || limit < 1) {
      return res.status(400).send("Invalid limit value");
    } else {
      res.json(carts.slice(0, limit));
    }
  } catch (err) {
    console.error("Error fetching carts:", err);
    res.status(500).send("Internal server error");
  }
});

/* Get by id */
cartsRouter.get("/:cid", async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cid).populate(
      "products.product"
    );
    if (!cart) {
      return res.status(404).send("Cart not found");
    }
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

/* Post */
cartsRouter.post("/", async (req, res) => {
  try {
    const newCart = new Cart();
    await newCart.save();
    res.status(201).json(newCart);
    console.log(`Cart created: id: ${newCart._id}`);
  } catch (err) {
    console.error("Error creating cart:", err);
    res.status(500).send("Internal server error");
  }
});

/* post by id */
cartsRouter.post("/:cid/product/:pid", async (req, res) => {
  const { cid, pid } = req.params;

  try {
    const cart = await Cart.findById(cid);
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const product = cart.products.find((p) => p.productId.toString() === pid);
    if (product) {
      product.quantity += 1;
    } else {
      cart.products.push({ productId: pid, quantity: 1 });
    }

    await cart.save();
    res.status(200).json({ message: "Product added to cart", cart });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

/* DELETE a product from a cart */
cartsRouter.delete("/:cid/products/:pid", async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const cart = await Cart.findById(cid);
    if (!cart) {
      return res.status(404).send("Cart not found");
    }

    cart.products = cart.products.filter(
      (product) => product.product.toString() !== pid
    );
    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

cartsRouter.delete("/:cid", async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cid);
    if (!cart) {
      return res.status(404).send("Cart not found");
    }

    cart.products = [];
    await cart.save();
    res
      .status(200)
      .json({ status: "success", message: "All products removed from cart" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

/* put */
cartsRouter.put("/:cid", async (req, res) => {
  try {
    const { cid } = req.params;
    const { products } = req.body;

    if (!Array.isArray(products)) {
      return res.status(400).send("Products must be an array");
    }

    const cart = await Cart.findById(cid);
    if (!cart) {
      return res.status(404).send("Cart not found");
    }

    cart.products = products.map((p) => ({
      product: p.product,
      quantity: p.quantity,
    }));

    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    console.error("Error updating cart:", err);
    res.status(500).send("Internal server error");
  }
});
/* put by i */
cartsRouter.put("/:cid/products/:pid", async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).send("Quantity must be a positive number");
    }

    const cart = await Cart.findById(cid);
    if (!cart) {
      return res.status(404).send("Cart not found");
    }

    const cartProduct = cart.products.find((p) => p.product.toString() === pid);
    if (!cartProduct) {
      return res.status(404).send("Product not found in cart");
    }

    cartProduct.quantity = quantity;

    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    console.error("Error updating product quantity in cart:", err);
    res.status(500).send("Internal server error");
  }
});

cartsRouter.use((err, req, res, next) => {
  if (err) res.status(500).json({ message: err.message });
});

export { cartsRouter };
