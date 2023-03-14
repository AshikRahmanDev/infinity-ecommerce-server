const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

// midelware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.sqgzvsr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Collection
const productsCollection = client.db("infinity").collection("products");
const userCollection = client.db("infinity").collection("users");

async function run() {
  try {
    // get product
    app.get("/products", async (req, res) => {
      const query = {};
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });
    // get products by id
    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });
    // register user
    app.post("/register", async (req, res) => {
      const userData = req.body;
      const result = await userCollection.insertOne(userData);
      res.send(result);
    });
    // add cart item in user
    app.put("/addCart/:email", async (req, res) => {
      const email = req.params.email;
      const cart = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const user = await userCollection.findOne(filter);

      if (user.cart) {
        const prevCart = user.cart;
        const exist = prevCart.find((e) => e.id === cart.id);
        if (exist) {
          res.send({ exist: true });
          return;
        } else {
          const updateDoc = {
            $set: {
              cart: [...user.cart, cart],
            },
          };

          const result = await userCollection.updateOne(
            filter,
            updateDoc,
            options
          );
          res.send(result);
        }
      } else {
        const updateDoc = {
          $set: {
            cart: [cart],
          },
        };
        const result = await userCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        res.send(result);
      }
    });
    // delete cart item in user
    app.put("/deleteItemFromCart/:email", async (req, res) => {
      const email = req.params.email;
      const id = req.query.id;
      console.log(id);
      const filter = { email: email };
      const options = { upsert: true };
      const user = await userCollection.findOne(filter);
      const prevCart = user.cart;
      const newCart = prevCart.filter((item) => item.id !== id);

      const updateDoc = {
        $set: {
          cart: [...newCart],
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });
    // get user cart
    app.get("/cart/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const cart = user?.cart;
      res.send(cart);
    });
    // get single cart item for checkout
    app.get("/cart/product/:id", async (req, res) => {
      const cartId = req.params.id;
      const email = req.query.email;
      const filter = { email: email };
      const user = await userCollection.findOne(filter);
      const cart = user.cart;
      const checkoutItem = cart.filter((item) => item.id === cartId);
      res.send(checkoutItem);
    });
    // add review in product
    app.put("/product/review/:id", async (req, res) => {
      const id = req.params.id;
      const rev = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };

      const product = await productsCollection.findOne(filter);

      if (product.reviews) {
        const prevReview = product?.reviews;
        const review = { ...rev, id: product.reviews.length + 1 };
        const updateDoc = {
          $set: {
            reviews: [...prevReview, review],
          },
        };
        const result = await productsCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        return res.send(result);
      } else {
        const review = { ...rev, id: 1 };
        const updateDoc = {
          $set: {
            reviews: [review],
          },
        };
        const result = await productsCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        res.send(result);
      }
    });
  } finally {
  }
}

run().catch((err) => {
  console.log(err);
});

app.get("/", (req, res) => {
  res.send("infinity server is working");
});

app.listen(port, () => {
  console.log(`server runnig on port ${port}`);
});
