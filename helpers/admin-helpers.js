var db = require('../config/connection')
var collection = require('../config/collection')
const bycrpt = require('bcrypt')
const { ObjectId } = require('mongodb')
const { response } = require('express')

module.exports = {
    doLogin: (adminData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: adminData.email })
            if (admin) {
                bycrpt.compare(adminData.password, admin.password).then((status) => {
                    if (status) {
                        console.log('login suxccss 11');
                        response.status = true
                        resolve(response)
                    } else {
                        console.log('login failed');
                        resolve({ status: false })
                    }

                })

            } else {
                console.log('login filed')
                resolve({ status: false })
            }
        })

    },

    changeStatus: (proId, data) => {

        return new Promise((resolve, reject) => {
            if (data == 'Placed') {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(proId) },
                    {
                        $set: {
                            status: data,
                            Pending: false,
                            Placed: true,
                            Shipped: false,
                            Delivered: false,
                            Cancel: false
                        }
                    }).then((response) => {
                        resolve(response)
                        console.log(response);
                    })
            } else if (data == 'Shipped') {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(proId) },
                    {
                        $set: {
                            status: data,
                            Pending: false,
                            Placed: false,
                            Shipped: true,
                            Delivered: false,
                            Cancel: false
                        }
                    }).then((response) => {
                        resolve(response)
                        console.log(response);
                    })
            } else if (data == 'Delivered') {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(proId) },
                    {
                        $set: {
                            status: data,
                            Pending: false,
                            Placed: false,
                            Shipped: false,
                            Delivered: true,
                            Cancel: false
                        }
                    }).then((response) => {
                        resolve(response)
                        console.log(response);
                    })
            } else if (data == 'Cancel') {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(proId) },
                    {
                        $set: {
                            status: data,
                            Pending: false,
                            Placed: false,
                            Shipped: false,
                            Delivered: false,
                            Cancel: true
                        }
                    }).then((response) => {
                        resolve(response)
                        
                    })
            } else if (data == 'Pending') {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(proId) },
                    {
                        $set: {
                            status: data,
                            Pending: true,
                            Placed: false,
                            Shipped: false,
                            Delivered: false,
                            Cancel: false
                        }
                    }).then((response) => {
                        resolve(response)
                        
                    })
            }

        })
    }

}