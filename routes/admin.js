var express = require('express');
const session = require('express-session');

var router = express.Router();
const adminHelpers = require('../helpers/admin-helpers');
const userHelpers = require('../helpers/user-helpers')
const productHelpers = require('../helpers/product-helpers');
const categoryHelpers = require('../helpers/catagory-helpers');
const { NetworkContext } = require('twilio/lib/rest/supersim/v1/network');
const { response } = require('express');

/* GET admin listing. */
router.get('/', function (req, res) {
  if (req.session.logIn) {
    let admin = req.session.admin
    res.redirect('/admin/index')
  } else {
    res.render('admin/login', { layout: 'admin-layout' });
  }
});

/* POST admin login  */
router.post('/login', (req, res) => {
  adminHelpers.doLogin(req.body).then((data) => {
    if (data.status) {
      req.session.logIn = true
      req.session.admin = data.admin
      res.redirect('/admin/viewproducts')
    } else {
      res.redirect('/admin/')
    }
  })
})


router.get('/index', (req, res) => {
  if (req.session.logIn) {
    res.render('admin/index', { layout: 'admin-layout' })
  } else {
    res.redirect('/admin/index', { layout: 'admin-layout' })
  }
})

// logout
router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/admin')
})


// add product
router.get('/addproducts', (req, res) => {
  categoryHelpers.viewcategory().then((category) => {
    res.render('admin/addproducts', { layout: 'admin-layout', category })
  })

})

router.post('/addproducts', (req, res) => {
  productHelpers.addproducts(req.body).then((id) => {
    let image = req.files.image
    image.mv('./public/product-image/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.redirect('/admin/viewproducts')
      } else {
        console.log('err');
      }
    })
  })
})

// view products
router.get('/viewproducts', (req, res) => {
  productHelpers.getAllProducts().then((product) => {
    res.render('admin/viewproducts', { layout: 'admin-layout', product })
  })
})

// delete product
router.get('/deleteproducts/:id', (req, res) => {
  let productId = req.params.id
  productHelpers.deleteProducts(productId).then((response) => {
    res.redirect('/admin/viewproducts')
  })
})


// edit products
router.get('/editproducts/:id', async (req, res) => {
  let product = await productHelpers.getProductDetails(req.params.id)
  categoryHelpers.viewcategory().then((category) => {
    res.render('admin/editproducts', { product, category, layout: 'admin-layout' })
  })
})

router.post('/editproducts/:id', (req, res) => {
  let id = req.params.id
  productHelpers.updateProduct(id, req.body).then(() => {
    res.redirect('/admin/viewproducts')
    if (req.files.image) {
      let image = req.files.image
      image.mv('./public/product-image/' + id + '.jpg')
    }
  })
})


//view all users
router.get('/viewusers', (req, res) => {
  productHelpers.getAllUsers().then((users) => {

    res.render('admin/viewusers', { users, layout: 'admin-layout' })
  })
})

// addcategory
router.get('/addcategory', (req, res) => {
  res.render('admin/addcategory', { layout: 'admin-layout' })
})

router.post('/addcategory', (req, res) => {
  categoryHelpers.addcategory(req.body).then((data) => {
    res.render('admin/addcategory', { data, layout: 'admin-layout' })


  })
})

// view category
router.get('/viewcategory', (req, res) => {
  categoryHelpers.viewcategory().then((category) => {
    res.render('admin/viewcategory', { category, layout: 'admin-layout' })
  })
})

// edit category
router.get('/editcategory/:id', async (req, res) => {
  let category = await categoryHelpers.getCategoryDetails(req.params.id)
  res.render('admin/editcategory', { category, layout: 'admin-layout' })
})

router.post('/editcategory/:id', (req, res) => {
  let id = req.params.id
  categoryHelpers.updateCategory(id, req.body).then(() => {
    res.redirect('/admin/viewcategory')
  })
})

// delete category
router.get('/deletecategory/:id', (req, res) => {
  categoryId = req.params.id
  categoryHelpers.deleteCategory(categoryId).then((data) => {
    res.redirect('/admin/viewcategory')
  })

})

// view all orders
router.get('/vieworders', (req, res) => {
  userHelpers.getAllOrders().then((orders) => {
    productHelpers.getAllUsers().then((users) => {

      res.render('admin/vieworders', { orders, users, layout: 'admin-layout' })
    })

  })

})

// view-allOrder-all-user-products


router.get('/view-allOrder-all-user-products', async (req, res, next) => {
  try {
    let products = await userHelpers.getAllOrderAllUserProducts(req.query.id, req.query.userId)


    res.render('admin/view-allOrder-all-user-products', { products, layout: 'admin-layout' })
  } catch (error) {
    next(error)
  }
})

// view-order-single-users
router.get('/view-users-order', async (req, res) => {
  console.log(req.query.id);

  let orders = await userHelpers.getOrderProducts(req.query.id)


  res.render('admin/view-users-order', { orders, layout: 'admin-layout' })
})



router.get('/view-users-order-details', async (req, res, next) => {
  try {
    let products = await userHelpers.getOrderProductsDetails(req.query.id, req.query.proId)
    

    res.render('admin/view-users-order-details', { products, layout: 'admin-layout' })
  } catch (error) {
    next(error)
  }
})

// view-order-all-user
router.get('/view-order-all-users', async (req, res, next) => {
  try {
    let products = await userHelpers.getOrderViewProducts(req.query.id, req.query.proId)

    res.render('admin/view-order-all-users', { products, layout: 'admin-layout' })
  } catch (error) {
    next(error)
  }
})

router.get('/change-status', (req, res) => {
  let proId = req.query.id
  let data = req.query.status
  
  adminHelpers.changeStatus(proId, data).then((response) => {
    // res.redirect('/admin/view-allOrder-all-user-products')
    res.redirect('back')
  })
})


  


module.exports = router;
