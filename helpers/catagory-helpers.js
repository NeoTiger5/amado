const collection = require('../config/collection')
var db = require('../config/connection')
let objectId = require('mongodb').ObjectId

module.exports = {
    //add category

    addcategory: (category) => {


        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).findOne(category).then((data) => {
                if (data) {
                    resolve({ err: 'Already Exist' })
                } else {
                    db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category).then((data) => {
                        resolve(data.insertedId)
                    })
                }
            })

        })
    },


    // view category

    viewcategory: () => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(category)
        })
    },

    //delete category
    deleteCategory: (categoryId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: objectId(categoryId) }).then((response) => {
                resolve(response)
            })
        })
    },

    // edit category
    getCategoryDetails: (categoryId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(categoryId) }).then((category) => {
                resolve(category)
            })
        })
    },

    //update product
    updateCategory: (categoryId, categorydetails) => {
        console.log(categorydetails);
        console.log(categoryId);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectId(categoryId) }, {
                $set: {

                    category: categorydetails.category,

                }
            }).then((response) => {
                resolve(response)

            })
        })
    },

    getSingleCategory: (category) => {
        console.log(category);

        return new Promise(async(resolve, reject) => {
           let categ =await db.get().collection(collection.PRODUCT_COLLECTION).find({category:category}).toArray() 
                resolve(categ)
                
            })
        
    }


}