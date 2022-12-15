class ProductManager {
  
  static code = 0;
  static productsList = [];

  constructor() {
    this.products = ProductManager.productsList;
  }
  static createId() {
    return this.code++;
  }
  getProducts() {
    return `Last products list: ${JSON.stringify(this.products)}`;
  }

  addProduct(title, description, price, thumbnail, stock) {
    this.newCode = ProductManager.createId();

    this.product =  {
      title,
      description,
      price,
      thumbnail,
      stock,
      id: this.newCode,
    }

    this.isFound = this.products.some(element => element.id === this.product.id)
    
    if(this.isFound || title != undefined || description != undefined || price != undefined || thumbnail != undefined || stock != undefined)
    {
      console.log("Element with id already in list")
      this.getProducts()
    }
    else{
      console.log(`Adding ${title} to the list`)
      this.products.push(this.product)
    }

  }
  getProductById(id) {
    this.productRequested = JSON.stringify(this.products.find( element => element.id === id))
    if (this.productRequested != undefined)
      return `Product found with id: ${id}: ${this.productRequested} `;
    else{
        console.log('Not found')
    }  
  }
}


/* Product one */
console.log("--------------Product 1-----------------")
product_1 = new ProductManager();
product_1.getProducts()
product_1.addProduct("Notebook", "Asus Zenbook i5", "$ 150.000", '/static/img/asus_zenbook.webp', 10);
console.log(product_1.getProducts());

/* Look for id */
console.log(product_1.getProductById(0))

console.log("--------------Product 2-----------------")
product_2 = new ProductManager();
product_2.getProducts()
product_2.addProduct("Gpu", "Nvidia RTX 3080ti 10GB", "$280.000", '/static/img/nvidia_gtx_3080ti.webp', 5);
console.log(product_2.getProducts());

/* Look for id */
console.log(product_2.getProductById(1))
