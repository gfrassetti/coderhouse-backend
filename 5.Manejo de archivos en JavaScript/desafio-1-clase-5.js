const fs = require("fs");
const path = require("path");

class ProductManager {
  static code = 0;

  constructor() {
    this.path = path.join(__dirname, "products.txt");
    fs.promises.writeFile("products.txt", "utf8");
  }
  static createId() {
    return this.code++;
  }
  async getProducts() {
    try {
      const data = await fs.promises.readFile(
        "products.txt",
        {
          encoding: "utf8",
        },
        (error, datos) => {
          error
            ? console.log(`Error: ${error}`)
            : console.log(`Datos Leidos: ${datos}`);
        }
      );
      const products = JSON.parse(data);
      console.log(products);
      return products;
    } catch (err) {
      throw err;
    }
  }

  async addProduct(title, description, price, thumbnail, stock) {
    this.newCode = ProductManager.createId();

    let product = {
      title,
      description,
      price,
      thumbnail,
      stock,
      id: this.newCode,
    };
    let products = [];
    if (products.some((p) => p.id === product.id)) {
      throw new Error("A product with the same ID already exists.");
    }
    products.push(product);
    console.log(`Product ${JSON.stringify(product.title)} added to the file`);

    await fs.promises.writeFile(
      "products.txt",
      JSON.stringify(products),
      "utf8"
    );
  }

  async getProductById(id) {
    const data = await fs.promises.readFile(
      "products.txt",
      { encoding: "utf8" },
      (error, datos) => {
        error
          ? console.log(`Error: ${error}`)
          : console.log(`Datos Leidos: ${datos}`);
      }
    );
    const products = JSON.parse(data);
    const product = products.find((product) => product.id === id);
    console.log(`Product with id ${id} found: ${JSON.stringify(product)}`);
  }

  async updateProduct(id, updatedProduct) {
    try {
      const data = await fs.promises.readFile("products.txt", {
        encoding: "utf8",
      });

      const products = JSON.parse(data);
      const productIndex = products.findIndex((product) => product.id === id);
      products[productIndex] = {
        ...products[productIndex],
        ...[updatedProduct],
      };
      await fs.promises.appendFile(
        this.path,
        JSON.stringify(products),
        "utf8",
        (err, data) => {
          err
            ? console.log(`Error: ${err}`)
            : console.log(`Datos Leidos: ${data}`);
        }
      );
      console.log(`File Updated: ${JSON.stringify(products)}`);
    } catch (err) {
      throw err;
    }
  }

  async deleteProduct(id) {
    try {
      const data = await fs.promises.readFile(this.path, "utf8");
      const products = JSON.parse(data);
      const filteredProducts = products.filter((product) => product.id !== id);
      await fs.promises.writeFile(
        this.path,
        JSON.stringify(filteredProducts),
        "utf8"
      );
      console.log(`Product ${filteredProducts} has been deleted`);
    } catch (err) {
      throw err;
    }
  }
}
/* Product one */
console.log("--------------Product 1-----------------");
const product_1 = new ProductManager();
product_1.addProduct(
  "Notebook",
  "Asus Zenbook i5",
  "$ 150.000",
  "/static/img/asus_zenbook.webp",
  10
);

product_1.getProducts();
product_1.getProductById(0);
product_1.updateProduct(0, "Hola");

