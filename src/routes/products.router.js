import { Router } from "express";
import { Product } from "../models/product.model.js";

const productsRouter = Router();

/* GET all  */
productsRouter.get("/", async (req, res) => {
  try {
    const { limit = 2, page = 1, sort, query } = req.query;

    const filters = {};
    if (query) {
      filters.$or = [{ category: query }, { status: query === "available" }];
    }

    const sortOption = sort === "desc" ? -1 : 1;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { price: sortOption },
    };

    const products = await Product.paginate(filters, options);

    const response = {
      status: "success",
      payload: products.docs,
      totalPages: products.totalPages,
      prevPage: products.hasPrevPage ? products.prevPage : null,
      nextPage: products.hasNextPage ? products.nextPage : null,
      page: products.page,
      hasPrevPage: products.hasPrevPage,
      hasNextPage: products.hasNextPage,
      prevLink: products.hasPrevPage
        ? `/api/products?page=${products.prevPage}&limit=${limit}`
        : null,
      nextLink: products.hasNextPage
        ? `/api/products?page=${products.nextPage}&limit=${limit}`
        : null,
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

/* GET product details */
productsRouter.get("/:pid", async (req, res) => {
  try {
    const productId = req.params.pid;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).render("error", { message: "Product not found" });
    }

    res.render("productDetails", { product });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

/* POST a new product */
productsRouter.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      code,
      price,
      category,
      status = true,
      stock = 10,
      thumbnails = [],
    } = req.body;

    if (!title || !description || !code || !price || !category || !stock) {
      return res.status(400).send("Missing required fields");
    }

    const newProduct = new Product({
      title,
      description,
      code,
      price,
      category,
      status,
      stock,
      thumbnails,
    });

    await newProduct.save();
    req.app.get("io").emit("products", await Product.find().lean());
    res.status(201).json(newProduct);
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).send("Internal server error");
  }
});

/* PUT an existing product */
productsRouter.put("/:pid", async (req, res) => {
  try {
    const { pid } = req.params;
    const { title, description, code, price, status, stock, category } =
      req.body;

    const product = await Product.findById(pid);

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

    await product.save();
    req.app.get("io").emit("products", await Product.find().lean());
    res.json(product);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).send("Internal server error");
  }
});

/* DELETE  a product */
productsRouter.delete("/:pid", async (req, res) => {
  try {
    const { pid } = req.params;

    const product = await Product.findByIdAndDelete(pid);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    req.app.get("io").emit("products", await Product.find().lean());
    res.status(202).send(`Product ${pid} deleted`);
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).send("Internal server error");
  }
});

export { productsRouter };
