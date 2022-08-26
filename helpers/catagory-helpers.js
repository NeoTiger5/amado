const collection = require('../config/collection')
var db = require('../config/connection')
let objectId = require('mongodb').ObjectId

module.exports = {
    //add category

    addcategory: (category) => {


        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.CATEGORY_COLLECTION).findOne(category).then((data) => {
                    if (data) {
                        resolve({ err: 'Already Exist' })
                    } else {
                        db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category).then((data) => {
                            resolve(data.insertedId)
                        })
                    }
                })
            } catch (error) {
                reject(error)
            }

        })
    },


    // view category

    viewcategory: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let category = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
                resolve(category)
            } catch (error) {
                reject(error)
            }
        })
    },

    //delete category
    deleteCategory: (categoryId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: objectId(categoryId) }).then((response) => {
                    resolve(response)
                })
            } catch (error) {
                reject(error)
            }
        })
    },

    // edit category
    getCategoryDetails: (categoryId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(categoryId) }).then((category) => {
                    resolve(category)
                })
            } catch (error) {
                reject(error)
            }
        })
    },

    //update product
    updateCategory: (categoryId, categorydetails) => {

        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectId(categoryId) }, {
                    $set: {

                        category: categorydetails.category,

                    }
                }).then((response) => {
                    resolve(response)

                })
            } catch (error) {
                reject(error)
            }
        })
    },

    getSingleCategory: (category) => {


        return new Promise(async (resolve, reject) => {
            try {
                let categ = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: category }).toArray()
                resolve(categ)

            } catch (error) {
                reject(error)
            }
        })

    }


}