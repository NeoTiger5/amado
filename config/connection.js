const mongoClient = require('mongodb').MongoClient
const state = {db: null}

module.exports.connect = (cb) => {
  const url = 'mongodb://localhost:27017'
  const dbname = 'Ecommerce'

  mongoClient.connect(url, (err, data) => {
    if (err)
    return done(err)
    state.db = data.db(dbname)
    cb()
  })

  //   module.exports.connect=connect;

  module.exports.get = function () {
    return state.db
  }


}