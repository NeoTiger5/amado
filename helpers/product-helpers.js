
const collection = require('../config/collection')
var db=require('../config/connection')
let objectId=require('mongodb').ObjectId


module.exports={
//add products    
    addproducts:(products)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).insertOne({
                name:products.name,
                price:parseInt(products.price),
                description:products.description,
                category:products.category
            }).then((data)=>{
            resolve(data.insertedId)
            })
        })
    },
    
// view products
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
           let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().limit(8).toArray()
           resolve(products)
        })
    },


    getAllProductsShop:()=>{
        return new Promise(async(resolve,reject)=>{
           let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
           resolve(products)
        })
    },

//delete products
    deleteProducts:(productId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(productId)}).then((response)=>{
                resolve(response)
            })
        })
    },

    // edit product
    getProductDetails:(productId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(productId)}).then((product)=>{
                resolve(product)
            })
        })
    },

//update product
     updateProduct:(productId,productdetails)=>{
        return new Promise((resolve,reject)=>{
            console.log(productdetails);
            
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(productId)},{
                $set:{
                    name:productdetails.name,
                    category:productdetails.category,
                    price:productdetails.price,
                    description:productdetails.description
                     
                }
            }).then((response)=>{
                resolve(response)

            })
        })
    },

//get all users
    getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            let users= await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
            
        })
    },

// get single product
    getSingleProduct:(productId)=>{
        return new Promise(async(resolve,reject)=>{
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(productId)})
           console.log(product);
            resolve(product)
        })
    }
}