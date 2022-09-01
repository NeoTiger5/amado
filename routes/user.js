var express = require('express');
const session = require('express-session');
var router = express.Router();

const userHelpers = require('../helpers/user-helpers')
const productHelpers = require('../helpers/product-helpers');
const catagoryHelpers = require('../helpers/catagory-helpers');
const twilioHelpers = require('../helpers/twilio-helpers');
const { ObjectId } = require('mongodb');


const verifyLogin = function (req, res, next) {
  try {
    if (req.session.loggedIn) {
      next()
    } else {
      res.redirect('/')
    }
  } catch (error) {
    next(error)
  }
}

/* GET home page. */
router.get('/', function (req, res, next) {
  try {
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
  } catch (error) {
    next(error)
  }
});


/* GET signup page. */
router.get('/signup', (req, res, next) => {
  try {
    res.render('user/user-signup', { layout: 'user-layout' })
  } catch (error) {
    next(error)
  }
})

/* GET login page. */
router.get('/login', (req, res, next) => {
  try {
    if (req.session.loggedIn) {
      res.redirect('/')
    } else {
      res.render('user/user-login', {
        layout: 'user-layout'
      })
    }
  } catch (error) {
    next(error)
  }
})


/* POST signup page */
router.post('/signup', (req, res, next) => {
  try {
    req.session.body = req.body
    twilioHelpers.dosms(req.session.body).then(() => {
      res.redirect('/otp')
    })
  } catch (error) {
    next(error)
  }
})


// otp rendering
router.get('/otp', (req, res, next) => {
  try {
    let user = req.session.user
    res.render('user/otp', { user, otpErr: req.session.otp, layout: 'user-layout' })
  } catch (error) {
    next(error)
  }
})


//post otp
router.post('/otp', (req, res, next) => {
  try {
    twilioHelpers.otpVerify(req.body, req.session.body).then(() => {
      userHelpers.doSignup(req.session.body).then((Response) => {

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
  } catch (error) {
    next(error)
  }
})


/* POST login page */
router.post('/login', (req, res, next) => {
  try {
    userHelpers.doLogin(req.body).then((data) => {
      if (data.status) {
        req.session.loggedIn = true
        req.session.user = data.user
        res.redirect('/')
      } else {
        res.redirect('/login')
      }
    })
  } catch (error) {
    next(error)
  }
})


// logout
router.get('/signout', (req, res, next) => {
  try {
    req.session.destroy()
    res.redirect('/')
  } catch (error) {
    next(error)
  }
})


// shop
router.get('/shop', verifyLogin, (req, res, next) => {
  try {

    let user = req.session.user
    productHelpers.getAllProductsShop().then((product) => {

      catagoryHelpers.viewcategory().then(async (category) => {
        cartCount = await userHelpers.getCartCount(req.session.user._id)
        let wishCount = await userHelpers.getWishCount(user._id)
        res.render('user/shop', { user, product, category, cartCount, wishCount, layout: 'user-layout' })
      })
    })
  } catch (error) {

    next(error)
  }
})


//view Category

router.get('/view-category', verifyLogin, async (req, res, next) => {
  try {
    let user = req.session.user
    catagoryHelpers.viewcategory().then(async (category) => {
      singleCategory = await catagoryHelpers.getSingleCategory(req.query.category)
      cartCount = await userHelpers.getCartCount(req.session.user._id)
      wishCount = await userHelpers.getWishCount(user._id)

      res.render('user/view-category', { user, category, cartCount, wishCount, singleCategory, layout: 'user-layout' })
    })
  } catch (error) {
    next(error)
  }
})

// single product details
router.get('/product-details', verifyLogin, (req, res, next) => {
  try {
    let user = req.session.user

    if (ObjectId(req.query.id)) {

      productHelpers.getSingleProduct(req.query.id).then(async (product) => {
        cartCount = await userHelpers.getCartCount(req.session.user._id)
        wishCount = await userHelpers.getWishCount(user._id)

        res.render('user/product-details', { cartCount, wishCount, user, product, layout: 'user-layout' })
      })
    }
  } catch (error) {
    next(error)
  }
})



// cart

router.get('/cart', verifyLogin, async (req, res, next) => {

  try {
    let user = req.session.user
    let users = user._id
    let cartProd = await userHelpers.getCartProducts(user._id)
    let totalValue = await userHelpers.getTotalAmount(user._id)
    let cartCount = await userHelpers.getCartCount(user._id)
    let wishCount = await userHelpers.getWishCount(user._id)


    res.render('user/cart', { cartProd, cartCount, wishCount, user, totalValue, layout: 'user-layout', users })
  } catch (error) {
    next(error)
  }
})



// Add to cart

router.get('/add-to-cart/:id', (req, res, next) => {
  try {

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
router.get('/wishlist', verifyLogin, async (req, res, next) => {
  try {
    let user = req.session.user
    let users = user._id
    let wishProd = await userHelpers.getWishlistProducts(user._id)
    let cartCount = await userHelpers.getCartCount(user._id)
    let wishCount = await userHelpers.getWishCount(user._id)

    res.render('user/wishlist', { wishProd, wishCount, cartCount, user, users, layout: 'user-layout' })
  } catch (error) {
    next(error)
  }
})

//add to wishlist
router.get('/add-to-wishlist/:id', (req, res, next) => {

  try {

    let user = req.session.user
    userHelpers.addToWishlist(req.params.id, user._id)
    res.json({ status: true })

  } catch (error) {

    next(error)
  }
})



// remove product from wishlist
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
  try {
    userHelpers.changeProductQuantity(req.body).then(async (response) => {
      response.totalValue = await userHelpers.getTotalAmount(req.body.user)
      res.json(response);
    })
  } catch (error) {
    next(error)
  }
})

// checkout

router.get('/place-order', verifyLogin, async (req, res, next) => {
  try {
    let user = req.session.user
    let users = user._id
    let address = await userHelpers.getAddress(user._id)
    let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
    let cartCount = await userHelpers.getCartCount(user._id)
    let wishCount = await userHelpers.getWishCount(user._id)
    res.render('user/place-order', { totalValue, cartCount, wishCount, users, user, address, layout: 'user-layout' })
  } catch (error) {
    next(error)
  }
})

// add address

router.get('/add-address', verifyLogin, async (req, res, next) => {
  try {
    let user = req.session.user
    let users = user._id
    let cartCount = await userHelpers.getCartCount(user._id)
    let wishCount = await userHelpers.getWishCount(user._id)
    res.render('user/add-address', { users, user, cartCount, wishCount, layout: 'user-layout' })
  } catch (error) {
    next(error)
  }
})


//add address post
router.post('/add-address', (req, res, next) => {
  try {
    let user = req.session.user
    userHelpers.addAddress(req.body, user._id).then(() => {
      res.redirect('/place-order')
    })
  } catch (error) {
    next(error)
  }
})

// place order post
router.post('/place-order', async (req, res, next) => {
  try {
    let user = req.session.user
    let address = await userHelpers.fetchAddress(user._id, req.body.address)
    let products = await userHelpers.getCartProductList(user._id)
    let totalPrice = await userHelpers.getTotalAmount(user._id)
    let discountData = null;
    if (req.body.Coupon_Code) {
      await userHelpers.checkCoupon(req.body.Coupon_Code, totalPrice).then((response) => {
        discountData = response;
      })

        .catch(() => (discountData = null));
    }
    userHelpers.placeOrder(req.body, products, totalPrice, address, user._id, discountData).then((orderId) => {
      if (req.body['payment-method'] === 'COD') {
        res.json({ codSuccess: true })
      } else {
        let netAmount = discountData ? discountData.amount : totalPrice;
        userHelpers.generateRazorpay(orderId, netAmount).then((response) => {

          res.json(response)
        })
      }
    })
  } catch (error) {
    next(error)
  }
})




// order success
router.get('/order-success', (req, res, next) => {
  try {
    res.render('user/order-success', { user: req.session.user, layout: 'user-layout' })
  } catch (error) {
    next(error)
  }
})

// Order
router.get('/order', verifyLogin, async (req, res, next) => {
  try {
    user = req.session.user
    let orders = await userHelpers.getOrderProducts(req.session.user._id)
console.log(orders);
    orderCount = orders.length
    let cartCount = await userHelpers.getCartCount(req.session.user._id)
    let wishCount = await userHelpers.getWishCount(req.session.user._id)
    res.render('user/order', { user, cartCount, wishCount, orders, layout: 'user-layout' })
  } catch (error) {
    next(error)
  }
})

// view order products details
router.get('/view-order-products-details', verifyLogin, async (req, res, next) => {
  try {
    if(ObjectId(req.query.id)&&ObjectId(req.query.proId)){
    user = req.session.user
    let products = await userHelpers.getOrderProductsDetails(req.query.id, req.query.proId)
    console.log('=================');
    console.log(products);
    console.log('=================');
    let cartCount = await userHelpers.getCartCount(req.session.user._id)
    let wishCount = await userHelpers.getWishCount(req.session.user._id)
    res.render('user/view-order-products-details', { user, cartCount, wishCount, products, layout: 'user-layout' })
    }
  } catch (error) {
    next(error)
  }
})

// verify payment
router.post('/verify-payment', (req, res, next) => {
  try {
    userHelpers.verifyPayment(req.body).then(() => {
      userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {


        res.json({ status: true })
      })
    }).catch((err) => {
      res.json({ status: false, errMsg: 'error' })
    })
  } catch (error) {
    next(error)
  }
})



// profile
router.get('/profile', verifyLogin, async (req, res, next) => {

  try {
    let user = req.session.user
      productHelpers.getSingleProduct(req.query.id).then(async (product) => {
      let products = await userHelpers.getOrderProducts(user._id)
      let orders = await userHelpers.getUserOrder(req.session.user._id)
      let cartCount = await userHelpers.getCartCount(req.session.user._id)
      let wishCount = await userHelpers.getWishCount(req.session.user._id)
      let address = await userHelpers.getAddress(user._id)
      orderCount = orders.length
      res.render('user/profile', { profile: true, user: req.session.user, product, products, orders, orderCount, cartCount, wishCount, address, layout: 'user-layout' })
    })
  } catch (error) {
    next(error)
  }
})


//post coupon
router.post("/check-coupon", async (req, res, next) => {
  try {


    let userId = req.session.user._id;
    let couponCode = req.body.coupon;
    let totalAmount = await userHelpers.getTotalAmount(userId);

    userHelpers.checkCoupon(couponCode, totalAmount).then((response) => {

      res.json(response);
    })
      .catch((response) => {
        res.json(response);
      });
  } catch (error) {
    next(error)
  }
});



router.get('/invoice',async(req,res,next)=>{
  try {
   
    user = req.session.user
    if(ObjectId(req.query._id)&&ObjectId(req.query.proId)){
    let products = await userHelpers.getOrderProductsDetails(req.query.id, req.query.proId)
    console.log(products);
    let cartCount = await userHelpers.getCartCount(req.session.user._id)
    let wishCount = await userHelpers.getWishCount(req.session.user._id)
    res.render('user/invoice', { user, cartCount, wishCount, products, layout: 'user-layout' })
    }
  } catch (error) {
    next(error)
  }
})





module.exports = router;