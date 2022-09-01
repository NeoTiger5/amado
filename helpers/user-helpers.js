var db = require('../config/connection')
var collection = require('../config/collection')
const bycrpt = require('bcrypt')
const { ObjectId } = require('mongodb')
var objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay')
require('dotenv').config()
const { resolve } = require('path')
const { log } = require('console')
var instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEYID,
    key_secret: process.env.RAZORPAY_KEYSECRET
});

module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.password = await bycrpt.hash(userData.password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data)
            })
        })

    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                bycrpt.compare(userData.password, user.password).then((status) => {
                    if (status) {

                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {

                        resolve({ status: false })
                    }

                })

            } else {

                resolve({ status: false })
            }
        })

    },
    addToCart: (productId, userId) => {

        let proObj = {
            item: ObjectId(productId),
            quantity: 1,
            status: 'pending'
        }

        return new Promise(async (resolve, reject) => {
            try {

                let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })


                if (userCart) {
                    let proExist = userCart.products.findIndex(products => products.item == productId)



                    if (proExist != -1) {
                        db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId), 'products.item': objectId(productId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        ).then(() => {
                            resolve()
                        })
                    } else {
                        db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
                            {
                                $push: { products: proObj }
                            }).then((response) => {
                                resolve()
                            })
                    }
                } else {
                    let cartObj = {
                        user: objectId(userId),
                        products: [proObj]
                    }
                    db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then(() => {
                        resolve()
                    })
                }
            } catch (error) {

                reject(error)
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            resolve(cartItems)
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart) },
                    {
                        $pull: { products: { item: ObjectId(details.product) } }
                    }).then((Response) => {
                        resolve({ removeProduct: true })
                    })
            } else {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) },
                    {
                        $inc: { 'products.$.quantity': details.count }
                    }).then((response) => {
                        resolve({ status: true })
                    })
            }

        })
    },
    getTotalAmount: (userId) => {

        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$product.price'] } }
                    }
                }
            ]).toArray()
            if (total.length == 0) {
                resolve(total)
            } else {

                resolve(total[0].total)

            }

        })

    },
    placeOrder: (order, products, total, address, userId, discountData) => {

        return new Promise((resolve, reject) => {


            let status = order['payment-method'] === 'COD' ? 'Pending' : 'Pending'
            let netAmount = discountData ? discountData.amount : total;
            let discount = discountData ? discountData.discount : null;
            let orderObj = {
                address: address,
                userId: ObjectId(order.userId),
                paymentMethod: order['payment-method'],
                products: products,
                TotalAmount: total,
                discountTotal: netAmount,
                discount: discount,
                status: status,
                date: new Date().toLocaleString()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectId(userId) })

                resolve(response.insertedId)

            })
        })
    },

    getCartProductList: (userId) => {

        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })



            resolve(cart.products)
        })

    },
    getUserOrder: (userId) => {

        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectId(userId) }).toArray()

            resolve(orders)

        })
    },
    getAllOrders: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find().sort({date:-1}).toArray()
            resolve(orders)
        })
    },




    getOrderProducts: (userId) => {


        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { userId: objectId(userId) }

                },

                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        date: 1,
                        TotalAmount: 1,
                        discountTotal: 1,
                        discount: 1,
                        address: 1,
                        paymentMethod: 1,
                        status: 1,
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        date: 1,
                        price: 1,
                        TotalAmount: 1,
                        discountTotal: 1,
                        deliveryDetails: 1,
                        discount: 1,
                        paymentMethod: 1,
                        status: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                },{
                    $sort:{'date':-1}
                }
            ]).toArray()

            resolve(orderItems)

        })
    },

    getOrderProductsDetails: (orderId, productId) => {

        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([

                {
                    $match: {
                        _id: objectId(orderId)
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $unwind: '$address'
                },

                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'products.item',
                        foreignField: '_id',
                        as: 'orders'
                    }
                },
                {
                    $unwind: '$orders'
                },
                {
                    $match: { 'orders._id': objectId(productId) }
                },
                {
                    $addFields: { address: '$address.shippingAddress' }
                }

                // {
                //     $project: {
                //         _id: 1,
                //         date: 1,
                //         userId: 1,
                //         'products.quantity':1,

                //         paymentMethod: 1,
                //         TotalAmount: 1,
                //         data: 1,
                //         status: 1,
                //         address: '$address.shippingAddress',
                //         orders: 1

                //     }
                // }
            ]).toArray()



            resolve(orderItems)
        })
    },

    getAllOrderAllUserProducts: (orderId, userId) => {
        return new Promise(async (resolve, reject) => {
            let productDetails = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        _id: objectId(orderId)
                    }
                },
                {
                    $match: {
                        userId: objectId(userId)
                    }
                },
                {
                    $unwind: '$address'
                },

                {
                    $unwind: '$products'
                },
                {
                    $lookup: {
                        from: collection.USER_COLLECTION,
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                {
                    $unwind: '$user'
                },
                {
                    $project: {
                        'products.item': 1,
                        'products.quantity': 1,
                        'address': 1,
                        'TotalAmount': 1,
                        'paymentMethod': 1,
                        'user': 1,
                        'date': 1,
                        'status': 1
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'products.item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $unwind: '$product'
                },


                {
                    $project: {
                        user: 1,
                        'address.shippingAddress.first_name': 1,
                        'address.shippingAddress.last_name': 1,
                        'address.shippingAddress.address': 1,
                        'address.shippingAddress.state': 1,
                        'address.shippingAddress.city': 1,
                        'address.shippingAddress.zipcode': 1,
                        'address.shippingAddress.phone_number': 1,

                        paymentMethod: 1,
                        TotalAmount: 1,
                        date: 1,
                        product: 1,
                        status: 1,
                        paymentMethod: 1,
                        'products.quantity': 1


                    }
                }

            ]).toArray()
            resolve(productDetails)
        })
    },


    generateRazorpay: (orderId, total) => {
        console.log('hhhhh');
        console.log(orderId);
console.log(total);
        return new Promise((resolve, reject) => {
            try {
                var options = {
                    amount: total * 100,
                    currency: "INR",
                    receipt: "" + orderId,

                }

                instance.orders.create(options, function (err, order) {
                    if (err) {
                        log("error")
                        console.log(err);
                    } else {
                        console.log("New Order:");
                        resolve(order)
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    },
    verifyPayment: (data) => {


        return new Promise((resolve, reject) => {
            try {
                const crypto = require('crypto');
                let hmac = crypto.createHmac('sha256', 'wvA8pptSbXqds0jCiiaNgkPo');

                hmac.update(data['payment[razorpay_order_id]'] + '|' + data['payment[razorpay_payment_id]'])
                hmac = hmac.digest('hex')
                if (hmac == data['payment[razorpay_signature]']) {
                    resolve()
                } else {
                    reject()
                }
            } catch (error) {
                reject(error)
            }

        })
    },

    changePaymentStatus: (orderId) => {

        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                    {
                        $set: {
                            status: 'Pending'
                        }
                    }).then(() => {
                        resolve()
                    })
            } catch (error) {
                reject(error)
            }
        })
    },

    addToWishlist: (productId, userId) => {

        let proObj = {
            item: ObjectId(productId),

        }
        return new Promise(async (resolve, reject) => {
            try {

                let userWishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
                if (userWishlist) {
                    let proExist = userWishlist.products.findIndex(products => products.item == productId)
                    if (proExist != -1) {
                        db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: objectId(userId) },
                            {
                                $pull: { products: { item: objectId(productId) } }
                            }
                        ).then(() => {
                            resolve({ active: true })
                        })
                    } else {
                        db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: objectId(userId) },
                            {
                                $push: { products: proObj }

                            }).then((response) => {
                                resolve()
                            })
                    }
                } else {
                    let cartObj = {
                        user: objectId(userId),
                        products: [proObj]
                    }
                    db.get().collection(collection.WISHLIST_COLLECTION).insertOne(cartObj).then(() => {
                        resolve()
                    })
                }
            } catch (error) {

                reject(error)
            }
        })
    },
    addAddress: (addressData, userId) => {
        addressData.time = Date.now()
        let address = [addressData]
        return new Promise(async (resolve, reject) => {
            try {
                let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
                if (user.shippingAddress) {
                    db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) },
                        {
                            $push: {
                                shippingAddress: addressData
                            }
                        }).then(() => {
                            resolve()
                        })
                } else {
                    db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) },
                        {
                            $set: {
                                shippingAddress: address
                            }
                        }).then(() => {
                            resolve()
                        })
                }
            } catch (err) {
                reject(err)
            }
        })
    },
    fetchAddress: (userId, addressId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
                if (user.shippingAddress) {
                    let address = await db.get().collection(collection.USER_COLLECTION).aggregate([
                        { $match: { _id: objectId(userId) } },
                        { $project: { shippingAddress: 1 } },
                        {
                            $unwind: '$shippingAddress'
                        },
                        { $match: { 'shippingAddress.time': parseInt(addressId) } }
                    ]).toArray()
                    resolve(address)
                } else {
                    resolve(false)
                }
            } catch (error) {
                reject(error)
            }
        })
    },
    getAddress: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
                if (user.shippingAddress) {
                    let userAddress = await db.get().collection(collection.USER_COLLECTION).aggregate([
                        { $match: { _id: objectId(userId) } },
                        { $project: { shippingAddress: 1 } },
                        {
                            $unwind: '$shippingAddress'
                        },
                        { $sort: { 'shippingAddress.time': -1 } },
                        { $limit: 3 }
                    ]).toArray()
                    resolve(userAddress)
                } else {
                    resolve(false)
                }
            } catch (err) {
                reject(err)
            }
        })
    },

    getWishlistProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let wishlistItems = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                    {
                        $match: { user: objectId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',

                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            item: 1,
                            product: { $arrayElemAt: ['$product', 0] }
                        }
                    }
                ]).toArray()
                resolve(wishlistItems)
            } catch (error) {
                reject(error)
            }
        })
    },
    getWishCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let count = 0
                let wish = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
                if (wish) {
                    count = wish.products.length
                }
                resolve(count)
            } catch (error) {
                reject(error)
            }
        })
    },
    removeFromCart: (data) => {

        let productId = data.productId
        let cartId = data.cartId
        return new Promise(async (resolve, reject) => {
            try {
                await db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(cartId) }, { $pull: { products: { item: objectId(productId) } } }).then(() => {

                    resolve()
                })
            } catch (error) {
                reject(error)
            }
        })
    },
    removeFromWishlist: (data) => {
        let wishId = data.wishId
        let productId = data.productId


        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ _id: objectId(wishId) }, { $pull: { products: { item: objectId(productId) } } }).then(() => {

                    resolve()
                })
            } catch (error) {
                reject(error)
            }
        })
    },
    checkCoupon: (code, amount) => {
        const coupon = code.toString().toUpperCase();
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.COUPON_COLLECTION).findOne({ name: coupon }).then((response) => {

                    if (response == null) {

                        reject({ status: false })
                    } else {
                        let offerPrice = parseInt(amount * response.offer / 100)

                        let newTotal = parseInt(amount - offerPrice)


                        resolve(response = {
                            couponCode: coupon,
                            status: true,
                            amount: newTotal,
                            discount: offerPrice
                        })

                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    },


}