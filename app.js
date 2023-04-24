const dotenv = require("dotenv");
dotenv.config(); // read env ducument
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth-routes");
const profileRoutes = require("./routes/profile-routes");
require("./config/passTemp"); // 引入 登入驗證設定
const session = require("express-session"); //用來對cookie簽名的套件
const passport = require("passport"); //用來驗證登入套件
const flash = require("connect-flash"); //引入flash套件(用來提醒用戶)

// 連結MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/loginDB")
  .then(() => {
    console.log("Connecting to mongodb database loginDB...");
  })
  .catch((e) => {
    console.log(e);
  });

// 設定排版引擎
app.set("view engine", "ejs");
// 設定Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// 用express-session套件來對cookie簽名, 確保不會被竄改
app.use(
  session({
    secret: process.env.SESSION_SECRET, //設定server端的session secret
    resave: false, //是指每次请求都重新设置 session cookie，假設你的 cookie 是 10分鐘過期，每次请求都会再設置 10分鐘。 兩個幾乎同時作用的request有race condition的情況發生
    saveUninitialized: false, //如果設定是true，會把「還沒修改過的」session就存進session store,設定false可以預防存入過多空session,
    cookie: { secure: false }, // secure: true是設定cookie只能經由https傳遞
  })
);
//初始化與驗證簽名(客戶端server之session與用戶瀏覽器端儲存之cookie交互驗證登入狀態)
app.use(passport.initialize()); //初始化
app.use(passport.session()); // restore login state from a session(藉由客戶端server與使用者瀏覽器端的cookie交互來驗證登入狀態)
// 設定 flash middleware
app.use(flash());
app.use((req, res, next) => {
  // req.flash("success_msg")中success_msg是key值 定義在message.ejs中
  //res.locals裡的屬性可以直接被ejs使用
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error"); //failureFlash的值會被自動套在這裡
  next();
});
// set routes
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
//首頁設定
app.get("/", (req, res) => {
  res.render("index", { user: req.user });
});

app.listen(8080, () => {
  console.log("Server running on port 8080.");
});
