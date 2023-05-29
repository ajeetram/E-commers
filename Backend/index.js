const express = require("express");
const cors = require("cors");
require("./db/config");
const User = require("./db/users");
const Product = require("./db/products");
const jwt = require("jsonwebtoken");
const jwtKey = "e.comm";
const app = express();
app.use(express.json());
app.use(cors());
/*****************User Registration API ***********************/
app.post("/register", async (req, res) => {
  const user = new User(req.body);
  var result = await user.save();
  result = result.toObject();
  delete result.password;
  jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
    if (err) {
      res.send({ result: "something went wrong, Please try after some time" });
    }
    res.send({ result, auth: token });
  });
});

/*************************user login API *******************************/
app.post("/login", async (req, res) => {
  if (req.body.password && req.body.email) {
    const user = await User.findOne(req.body).select("-password");
    if (user) {
      jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
          res.send({
            result: "something went wrong, Please try after some time",
          });
        }
        res.send({ user, auth: token });
      });
    } else {
      res.send({ result: "No user found" });
    }
  } else {
    res.send("Please fill all the fields");
  }
});

/***************Products Adding API************************/
app.post("/addproducts",verifyToken, async (req, res) => {
  const product = new Product(req.body);
  const result = await product.save();
  res.send(result);
});

/****************Product Listing API ********************/

app.get("/products",verifyToken, async (req, res) => {
  let products = await Product.find();
  if (products.length > 0) {
    res.send(products);
  } else {
    res.send("No products found");
  }
});

/***********************Delete Products******************/

app.delete("/products/:id",verifyToken, async (req, res) => {
  const result = await Product.deleteOne({ _id: req.params.id });
  res.send(result);
});

/***********************Update Products******************/

app.get("/products/:id",verifyToken, async (req, res) => {
  const result = await Product.findOne({ _id: req.params.id });
  if (result) {
    res.send(result);
  } else {
    res.send({ result: "No record found" });
  }
});

app.put("/products/:id", verifyToken,async (req, res) => {
  let result = await Product.updateOne(
    { _id: req.params.id },
    {
      $set: req.body,
    }
  );
  res.send(result);
});

/*****************************Search API****************/

app.get("/search/:key",verifyToken, async (req, res) => {
  const result = await Product.find({
    $or: [
      { name: { $regex: req.params.key } },
      { price: { $regex: req.params.key } },
      { company: { $regex: req.params.key } },
      { category: { $regex: req.params.key } },
    ],
  });

  res.send(result);
});

/*********Middleware for token authuntication**********/

function verifyToken(req,res,next)
{
  let token = req.headers['authorization'];
  if(token)
  {
    token = token.split(' ')[1];
    jwt.verify(token,jwtKey,(err,valid)=>{
      if(err)
      {
        res.status(401).send({result:"Please provide valid token"})
      }
      else{
        next();
      }
    })
  }
  else
  {
    res.status(403).send({result:"Please add token with header"})
  }
}


app.listen(3000);
