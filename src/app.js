import express from "express";
import { productsRouter } from "./routes/products.router.js";
import { cartsRouter } from "./routes/carts.router.js";
import { engine } from "express-handlebars";
import { Server } from "socket.io";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

//Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public"))); // Middleware para servir archivos estáticos

app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);

//leer productos
const readProducts = () => {
  const productsFilePath = path.join(__dirname, "data", "products.json");
  const data = fs.readFileSync(productsFilePath, "utf8");
  return JSON.parse(data);
};

app.get("/", (req, res) => {
  res.render("home", { products: readProducts() });
});

//productos en tiempo real
app.get("/realtimeproducts", (req, res) => {
  res.render("realTimeProducts", { products: readProducts() });
});

//socket.io
io.on("connection", (socket) => {
  console.log("New client connected");

  //enviar la lista de productos cuando un cliente se conecta
  socket.emit("products", readProducts());

  socket.on("addProduct", (product) => {
    const products = readProducts();
    const newProduct = {
      id: uuidv4(),
      ...product,
    };
    products.push(newProduct);
    fs.writeFileSync(
      path.join(__dirname, "data", "products.json"),
      JSON.stringify(products, null, 2)
    );
    io.emit("products", products);
  });

  socket.on("deleteProduct", (productId) => {
    let products = readProducts();
    products = products.filter((p) => p.id !== productId);
    fs.writeFileSync(
      path.join(__dirname, "data", "products.json"),
      JSON.stringify(products, null, 2)
    );
    io.emit("products", products);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

server.listen(8080, () => {
  console.log("Server running on port 8080");
});
