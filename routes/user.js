var express = require('express');
const session = require('express-session');
var router = express.Router();

const userHelpers = require('../helpers/user-helpers')
const productHelpers = require('../helpers/product-helpers');
const catagoryHelpers = require('../helpers/catagory-helpers');
const twilioHelpers = require('../helpers/twilio-helpers');


const verifyLogin = function (req, res, next) {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/')
  }
}

/* GET home page. */
router.get('/', function (req, res, next) {
  let cartCount = null
  productHelpers.getAllProducts().then(async (product) => {
    if (req.session.loggedIn) {
      let user = req.session.user
      cartCount = await userHelpers.getCartCount(req.session.user._id)
      let wishCount = await userHelpers.getWishCount(user._id)

      res.render('user/index', { user, product, wishCount, cartCount, layout: 'user-layout' });
    } else {
      res.render('user/index', { layout: 'user-layout', product })
    }
  })
});


/* GET signup page. */
router.get('/signup', (req, res) => {
  res.render('user/user-signup', { layout: 'user-layout' })
})

/* GET login page. */
router.get('/login', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/user-login', {
      layout: 'user-layout'
    })
    // req.session.loginErr=false
  }
})


/* POST signup page */
router.post('/signup', (req, res) => {
  req.session.body = req.body
  twilioHelpers.dosms(req.session.body).then(() => {
    res.redirect('/otp')
  })
})


// otp rendering
router.get('/otp', (req, res) => {
  let user = req.session.user
  res.render('user/otp', { user, otpErr: req.session.otp, layout: 'user-layout' })
})


//post otp
router.post('/otp', (req, res) => {
  twilioHelpers.otpVerify(req.body, req.session.body).then(() => {
    userHelpers.doSignup(req.session.body).then((Response) => {
      console.log(Response);
      if (Response) {
        res.redirect('/login')
      } else {
        res.redirect('/signup')
      }
    })
  }).catch((err) => {
    req.session.otp = err
    res.redirect('/otp')
  })
})


/* POST login page */
router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((data) => {
    if (data.status) {
      req.session.loggedIn = true
      req.session.user = data.user
      res.redirect('/')
    } else {
      // req.session.loginErr='Invalid Username'
      res.redirect('/login')
    }
  })
})


// logout
router.get('/signout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})


// shop
router.get('/shop', verifyLogin, (req, res) => {
  let user = req.session.user
  productHelpers.getAllProductsShop().then((product) => {
    catagoryHelpers.viewcategory().then(async (category) => {
      cartCount = await userHelpers.getCartCount(req.session.user._id)
      let wishCount = await userHelpers.getWishCount(user._id)

      res.render('user/shop', { user, product, category, cartCount, wishCount, layout: 'user-layout' })
    })
  })
})


//view Category

router.get('/view-category', verifyLogin, async (req, res, next) => {

  try {
    let user = req.session.user
    catagoryHelpers.viewcategory().then(async (category) => {
      singleCategory = await catagoryHelpers.getSingleCategory(req.query.category)
      cartCount = await userHelpers.getCartCount(req.session.user._id)
      wishCount = await userHelpers.getWishCount(user._id)
      console.log(singleCategory);
      res.render('user/view-category', { user, category, cartCount, wishCount, singleCategory, layout: 'user-layout' })

    })

  } catch (error) {
    next(error)
  }
})

// single product details
router.get('/product-details', verifyLogin, (req, res) => {
  let user = req.session.user
  productHelpers.getSingleProduct(req.query.id).then(async (product) => {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    wishCount = await userHelpers.getWishCount(user._id)

    res.render('user/product-details', { cartCount, wishCount, user, product, layout: 'user-layout' })
  })
})



// cart

router.get('/cart', verifyLogin, async (req, res) => {

  let user = req.session.user
  let users = user._id
  let cartProd = await userHelpers.getCartProducts(user._id)
  let totalValue = await userHelpers.getTotalAmount(user._id)
  let cartCount = await userHelpers.getCartCount(user._id)
  let wishCount = await userHelpers.getWishCount(user._id)


  res.render('user/cart', { cartProd, cartCount, wishCount, user, totalValue, layout: 'user-layout', users })
})



// Add to cart

router.get('/add-to-cart/:id', (req, res, next) => {
  try {
    console.log('api call');
    let user = req.session.user
    userHelpers.addToCart(req.params.id, user._id)
    res.json({ status: true })
  } catch (error) {

    next(error)
  }
})

// remove product from cart
router.post('/removeProductFromCart', (req, res, next) => {

  try {
    userHelpers.removeFromCart(req.body).then(() => {

      res.json({ productRemoved: true })

    })
  } catch (error) {
    next(error)
  }
})


// wishlist
router.get('/wishlist', verifyLogin, async (req, res) => {
  let user = req.session.user
  let users = user._id
  let wishProd = await userHelpers.getWishlistProducts(user._id)
  let cartCount = await userHelpers.getCartCount(user._id)
  let wishCount = await userHelpers.getWishCount(user._id)

  res.render('user/wishlist', { wishProd, wishCount, cartCount, user, users, layout: 'user-layout' })
})

//add to wishlist
router.get('/add-to-wishlist/:id', (req, res) => {
  console.log(req.param.id);
  try {
    console.log('api call wishlist');
    let user = req.session.user
    userHelpers.addToWishlist(req.params.id, user._id)
    res.json({ status: true })
    // res.json({ status: true })
  } catch (error) {

    next(error)
  }
})



// remove product from whishlist
router.post('/removeProductFromWishlist', (req, res, next) => {

  try {

    userHelpers.removeFromWishlist(req.body).then(() => {
      res.json({ productRemoved: true })
    })
  } catch (error) {
    next(error)
  }
})



// change product Quantity

router.post('/change-product-quantity', (req, res, next) => {

  console.log(req.body);
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    console.log(req.body.user);
    response.totalValue = await userHelpers.getTotalAmount(req.body.user)

    console.log(response);
    res.json(response);

  })
})

// checkout

router.get('/place-order', verifyLogin, async (req, res) => {
  let user = req.session.user
  let users = user._id
  let address = await userHelpers.getAddress(user._id)

  let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
  let cartCount = await userHelpers.getCartCount(user._id)
  let wishCount = await userHelpers.getWishCount(user._id)

  res.render('user/place-order', { totalValue, cartCount, wishCount, users, user, address, layout: 'user-layout' })
})

// add address

router.get('/add-address', verifyLogin, (req, res) => {
  res.render('user/add-address', { layout: 'user-layout' })
})
router.post('/add-address', (req, res) => {
  let user = req.session.user
  userHelpers.addAddress(req.body, user._id).then(() => {
    res.redirect('/place-order')
  })
})

// place order post
router.post('/place-order', async (req, res) => {
  let user = req.session.user
  let address = await userHelpers.fetchAddress(user._id, req.body.address)
  let products = await userHelpers.getCartProductList(user._id)


  let totalPrice = await userHelpers.getTotalAmount(user._id)
  userHelpers.placeOrder(req.body, products, totalPrice, address, user._id).then((orderId) => {

    if (req.body['payment-method'] === 'COD') {
      res.json({ codSuccess: true })
    } else {
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        res.json(response)
      })
    }
  })


})




// order success
router.get('/order-success', (req, res) => {
  res.render('user/order-success', { user: req.session.user, layout: 'user-layout' })
})

// Order
router.get('/order', verifyLogin, async (req, res) => {
  user = req.session.user
  // let orders = await userHelpers.getUserOrder(req.session.user._id)
  let orders = await userHelpers.getOrderProducts(req.session.user._id)
  orderCount = orders.length

  let cartCount = await userHelpers.getCartCount(req.session.user._id)
  let wishCount = await userHelpers.getWishCount(req.session.user._id)
  console.log(orders);

  res.render('user/order', { user, cartCount, wishCount, orders, layout: 'user-layout' })
})

// view order products details
router.get('/view-order-products-details', verifyLogin, async (req, res) => {
  user = req.session.user
  let products = await userHelpers.getOrderProductsDetails(req.query.id, req.query.proId)
  console.log(products);
  let cartCount = await userHelpers.getCartCount(req.session.user._id)
  let wishCount = await userHelpers.getWishCount(req.session.user._id)
  console.log(products);

  res.render('user/view-order-products-details', { user, cartCount, wishCount, products, layout: 'user-layout' })
})

// verify payment
router.post('/verify-payment', (req, res) => {
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {

      console.log('payment successfull');
      res.json({ status: true })
    })
  }).catch((err) => {
    res.json({ status: false, errMsg: 'error' })
  })
})



// profile
router.get('/profile', verifyLogin, async (req, res) => {

  let user = req.session.user
  productHelpers.getSingleProduct(req.query.id).then(async (product) => {

    let products = await userHelpers.getOrderProducts(user._id)
    console.log(products);
    let orders = await userHelpers.getUserOrder(req.session.user._id)
    let cartCount = await userHelpers.getCartCount(req.session.user._id)
    let wishCount = await userHelpers.getWishCount(req.session.user._id)
    let address = await userHelpers.getAddress(user._id)
    orderCount = orders.length



    res.render('user/profile', { profile: true, user: req.session.user, product, products, orders, orderCount, cartCount, wishCount, address, layout: 'user-layout' })
  })
})





module.exports = router;