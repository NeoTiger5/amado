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
router.get('/', function (req, res,next) {
 try{
  if (req.session.logIn) {
    let admin = req.session.admin
    res.redirect('/admin/index')
  } else {
    res.render('admin/login', { layout: 'admin-layout' });
  }
 }catch(error){
  next(error)
 }
});

/* POST admin login  */
router.post('/login', (req, res,next) => {
  try{
    adminHelpers.doLogin(req.body).then((data) => {
      if (data.status) {
        req.session.logIn = true
        req.session.admin = data.admin
        res.redirect('/admin/viewproducts')
      } else {
        res.redirect('/admin/')
      }
    })
  }catch(error){
    next(error)
  }
})


router.get('/index', (req, res,next) => {
 try{
  if (req.session.logIn) {
    res.render('admin/index', { layout: 'admin-layout' })
  } else {
    res.redirect('/admin/index', { layout: 'admin-layout' })
  }
 }catch(error){
  next(error)
 }
})

// logout
router.get('/logout', (req, res,next) => {
 try{
  req.session.destroy()
  res.redirect('/admin')
 }catch(error){
  next(error)
 }
})


// add product
router.get('/addproducts', (req, res,next) => {
  try{
    categoryHelpers.viewcategory().then((category) => {
      res.render('admin/addproducts', { layout: 'admin-layout', category })
    })
  }catch(error){
    next(error)
  }

})

router.post('/addproducts', (req, res,next) => {
 try{
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
 }catch(error){
  next(error)
 }
})

// view products
router.get('/viewproducts', (req, res,next) => {
 try{
  productHelpers.getAllProducts().then((product) => {
    res.render('admin/viewproducts', { layout: 'admin-layout', product })
  })
 }catch(error){
  next(error)
 }
})

// delete product
router.get('/deleteproducts/:id', (req, res,next) => {
 try{
  let productId = req.params.id
  productHelpers.deleteProducts(productId).then((response) => {
    res.redirect('/admin/viewproducts')
  })
 }catch(error){
  next(error)
 }
})


// edit products
router.get('/editproducts/:id', async (req, res,next) => {
 try{ let product = await productHelpers.getProductDetails(req.params.id)
  categoryHelpers.viewcategory().then((category) => {
    res.render('admin/editproducts', { product, category, layout: 'admin-layout' })
  })
}catch(error){
  next(error)
}
})

router.post('/editproducts/:id', (req, res,next) => {
 try{
  let id = req.params.id
  productHelpers.updateProduct(id, req.body).then(() => {
    res.redirect('/admin/viewproducts')
    if (req.files.image) {
      let image = req.files.image
      image.mv('./public/product-image/' + id + '.jpg')
    }
  })
 }catch(error){
  next(error)
 }
})


//view all users
router.get('/viewusers', (req, res,next) => {
 try{
  let id = req.params.id
  productHelpers.updateProduct(id, req.body).then(() => {
    res.redirect('/admin/viewproducts')
    if (req.files.image) {
      let image = req.files.image
      image.mv('./public/product-image/' + id + '.jpg')
    }
  })
 }catch(error){
  next(error)
 }
})

// addcategory
router.get('/addcategory', (req, res,next) => {
 try{
  res.render('admin/addcategory', { layout: 'admin-layout' })
 }catch(error){
  next(error)
 }
})


//add category post
router.post('/addcategory', (req, res,next) => {
 try{
  categoryHelpers.addcategory(req.body).then((data) => {
    res.render('admin/addcategory', { data, layout: 'admin-layout' })
  })
 }catch(error){
  next(error)
 }
})

// view category
router.get('/viewcategory', (req, res,next) => {
 try{
  categoryHelpers.viewcategory().then((category) => {
    res.render('admin/viewcategory', { category, layout: 'admin-layout' })
  })
 }catch(error){
  next(error)
 }
})

// edit category
router.get('/editcategory/:id', async (req, res,next) => {
 try{
  let category = await categoryHelpers.getCategoryDetails(req.params.id)
  res.render('admin/editcategory', { category, layout: 'admin-layout' })
 }catch(error){
  next(error)
 }
})

router.post('/editcategory/:id', (req, res,next) => {
 try{
  let id = req.params.id
  categoryHelpers.updateCategory(id, req.body).then(() => {
    res.redirect('/admin/viewcategory')
  })
 }catch(error){
  next(error)
 }
})

// delete category
router.get('/deletecategory/:id', (req, res,next) => {
 try{
  categoryId = req.params.id
  categoryHelpers.deleteCategory(categoryId).then((data) => {
    res.redirect('/admin/viewcategory')
  })
 }catch(error){
  next(error)
 }

})

// view all orders
router.get('/vieworders', (req, res,next) => {
  try{
    categoryId = req.params.id
    categoryHelpers.deleteCategory(categoryId).then((data) => {
      res.redirect('/admin/viewcategory')
    })
  }catch(error){
    next(error)
  }

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
router.get('/view-users-order', async (req, res,next) => {
  try{
    let orders = await userHelpers.getOrderProducts(req.query.id)
  res.render('admin/view-users-order', { orders, layout: 'admin-layout' })
  }catch(error){
    next(error)
  }
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

router.get('/change-status', (req, res,next) => {
 try{
  let proId = req.query.id
  let data = req.query.status
  adminHelpers.changeStatus(proId, data).then((response) => {
    res.redirect('back')
  })
 }catch(error){
  next(error)
 }
})


  


module.exports = router;
