
const collection = require('../config/collection')
var db = require('../config/connection')
let objectId = require('mongodb').ObjectId


module.exports = {
    //add products    
    addproducts: (products) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.PRODUCT_COLLECTION).insertOne({
                    name: products.name,
                    price: parseInt(products.price),
                    description: products.description,
                    category: products.category
                }).then((data) => {
                    resolve(data.insertedId)
                })
            } catch (error) {
                reject(error)
            }
        })
    },

    // view products
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().limit(8).toArray()
                resolve(products)
            } catch (error) {
                reject(error)
            }
        })
    },


    getAllProductsShop: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
                resolve(products)
            } catch (error) {
                reject(error)
            }
        })
    },

    //delete products
    deleteProducts: (productId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(productId) }).then((response) => {
                    resolve(response)
                })
            } catch (error) {
                reject(error)
            }
        })
    },

    // edit product
    getProductDetails: (productId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(productId) }).then((product) => {
                    resolve(product)
                })
            } catch (error) {
                reject(error)
            }
        })
    },

    //update product
    updateProduct: (productId, productdetails) => {
        return new Promise((resolve, reject) => {


            try {
                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(productId) }, {
                    $set: {
                        name: productdetails.name,
                        category: productdetails.category,
                        price: productdetails.price,
                        description: productdetails.description

                    }
                }).then((response) => {
                    resolve(response)

                })
            } catch (error) {
                reject(error)
            }
        })
    },

    //get all users
    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
                resolve(users)
            } catch (error) {
                reject(error)
            }

        })
    },

    // get single product
    getSingleProduct: (productId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(productId) })
                resolve(product)
            } catch (error) {
                reject(error)
            }
        })
    }
}