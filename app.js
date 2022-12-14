var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('express-handlebars')
var db = require('./config/connection')

const nocache = require('nocache');
const dotenv = require('dotenv')
dotenv.config()


var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');

var app = express();

var session = require('express-session')

var fileUpload = require('express-fileupload')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({ helpers: { inc: (value) => { return parseInt(value) + 1; } }, extname: 'hbs', Layout: 'user-layout', layoutsDir: __dirname + '/views/layout/', partialsDir: __dirname + '/views/Partials/' }))

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())

app.use(nocache())

// session setting
app.use(session({

  secret: "xoxo",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000000 }
}))



db.connect((err) => {
  if (err)
    console.log("Connection error" + err);

  else
    console.log("Database connect to port");
})


app.use('/', userRouter);
app.use('/admin', adminRouter);

app.use(function (req, res, next) {
  res.render('error',{layout:'user-layout'})
  // next(createError(404));
});
// catch 404 and forward to error handler

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  // res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error',{layout:'user-layout'})

});

module.exports = app;
