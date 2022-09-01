var db = require('../config/connection')
var collection = require('../config/collection')
const bycrpt = require('bcrypt')
const { ObjectId } = require('mongodb')
const { response } = require('express')

module.exports = {
  doLogin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      try {
        let loginStatus = false
        let response = {}
        let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: adminData.email })

        if (admin) {
          bycrpt.compare(adminData.password, admin.password).then((status) => {
            if (status) {
              response.status = true
              resolve(response)
            } else {
              resolve({ status: false })
            }
          })
        } else {
          resolve({ status: false })
        }
      } catch (error) {
        reject(error)
      }
    })

  },

  changeStatus: (proId, data) => {

    return new Promise((resolve, reject) => {
      try {
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
      } catch (error) {
        reject(error)
      }

    })
  }, onlinePaymentCount: () => {

    return new Promise(async (resolve, reject) => {
      try {
        let count = await db.get().collection(collection.ORDER_COLLECTION).find({ paymentMethod: "ONLINE" }).count()
        resolve(count)

      } catch (err) {
        reject(err)
      }

    })
  },
  totalUsers: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = await db.get().collection(collection.USER_COLLECTION).find().count()
        resolve(count)
      } catch (err) {
        reject(err)
      }
    })
  },
  totalOrder: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = await db.get().collection(collection.ORDER_COLLECTION).find().count()
        resolve(count)
      } catch (err) {
        reject(err)
      }
    })
  },
  cancelOrder: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          {
            $match: {
              status: "Cancel"
            }
          },
          {
            $count: 'number'
          }

        ]).toArray()
        resolve(count)


      } catch (err) {
        reject(err)
      }

    })
  },
  totalCOD: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = await db.get().collection(collection.ORDER_COLLECTION).find({ paymentMethod: "COD", }).count()
        resolve(count)
      } catch (err) {
        reject(err)
      }
    })
  },
  totalDeliveryStatus: (data) => {
    return new Promise(async (resolve, reject) => {
      try {
        let statusCount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          {
            $match: {
              status: data
            }
          },

          {
            $count: 'number'
          }

        ]).toArray()
        resolve(statusCount)
      } catch (err) {
        reject(err)
      }
    })
  },
  totalCost: () => {
    return new Promise(async (resolve, reject) => {
      try {
        total = await db.get().collection(collection.ORDER_COLLECTION).aggregate([


          {
            $project: {
              'TotalAmount': 1
            }
          },
          {
            $group: {
              _id: null,
              sum: { $sum: '$TotalAmount' }
            }
          }
        ]).toArray()
        resolve(total)
      } catch (err) {
        reject(err)
      }
    })
  },



  postGenerateCoupon: (couponData) => {

    const oneDay = 1000 * 60 * 60 * 24

    let couponObj = {
      name: couponData.name.toUpperCase(),
      offer: parseFloat(couponData.offer),
      validity: new Date(new Date().getTime() + (oneDay * parseInt(couponData.validity)))
    }


    return new Promise((resolve, reject) => {
      try {
        db.get().collection(collection.COUPON_COLLECTION).find().toArray().then((result) => {
          if (result[0] == null) {
            db.get().collection(collection.COUPON_COLLECTION).createIndex({ "name": 1 }, { unique: true })
            db.get().collection(collection.COUPON_COLLECTION).createIndex({ "validity": 1 }, { expireAfterSeconds: 0 })
            db.get().collection(collection.COUPON_COLLECTION).insertOne(couponObj).then((response) => {
              resolve(response)
            })
          } else {
            db.get().collection(collection.COUPON_COLLECTION).insertOne(couponObj).then((response) => {
              resolve(response)
            })
          }

        })
      } catch (error) {
        reject(error)

      }

    })

  },

  displayCoupons: () => {
    return new Promise((resolve, reject) => {
      try {
        let coupons = db.get().collection(collection.COUPON_COLLECTION).find().toArray()
        resolve(coupons)
      } catch (error) {
        reject(error)
      }
    })
  },





}