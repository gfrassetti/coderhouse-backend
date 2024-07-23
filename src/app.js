import express from "express";
import { productsRouter } from "./routes/products.router.js";
import { cartsRouter } from "./routes/carts.router.js";
import { engine } from "express-handlebars";
import { Server } from "socket.io";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

// Configurar Handlebars sin un diseño predeterminado
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public"))); // Middleware para servir archivos estáticos

// Pasar la instancia de io a cada solicitud
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);

// Leer productos
const readProducts = () => {
  const productsFilePath = path.join(__dirname, "data", "products.json");
  const data = fs.readFileSync(productsFilePath, "utf8");
  return JSON.parse(data);
};

// Ruta principal
app.get("/", (req, res) => {
  res.render("home", { products: readProducts() });
});

// Nueva ruta para productos en tiempo real
app.get("/realtimeproducts", (req, res) => {
  res.render("realTimeProducts", { products: readProducts() });
});

// Configurar Socket.io
io.on("connection", (socket) => {
  console.log("New client connected");

  // Enviar la lista de productos cuando un cliente se conecta
  socket.emit("products", readProducts());

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });

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
    io.emit("products", products); // Emitir a todos los clientes la lista actualizada de productos
  });

  socket.on("deleteProduct", (productId) => {
    let products = readProducts();
    products = products.filter((p) => p.id !== productId);
    fs.writeFileSync(
      path.join(__dirname, "data", "products.json"),
      JSON.stringify(products, null, 2)
    );
    io.emit("products", products); // Emitir a todos los clientes la lista actualizada de productos
  });
});

// Iniciar el servidor
server.listen(8080, () => {
  console.log("Server running on port 8080");
});
