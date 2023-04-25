const router = require("express").Router();
const passport = require("passport"); //passport是用來做登入驗證的套件
const User = require("../models/user-model");
const bcrypt = require("bcrypt"); // 將password做加密

//login功能
router.get("/login", (req, res) => {
  return res.render("login", { user: req.user });
});

//logout功能
router.get("/logout", (req, res) => {
  req.logOut((err) => {
    if (err) {
      return res.send(err);
    }
    return res.redirect("/");
  });
});

router.get("/signup", (req, res) => {
  return res.render("signup", { user: req.user });
});

//設定google驗證登入
router.get(
  //第一個參數設定要auth的resource keeper
  "/google",
  //第二個參數設定middleware用passport物件來做驗證
  /*
  當執行passport.authenticate("google")時 會去找auth的登入strategy(以google為例,寫在../config/passTemp.js裡) 
  passport.authenticate("要使用的auth", {
    scope: ["profile, email"], <= 要從auth 裡面resource server拿到的東西
    prompt: "select_account", <=加入這個prompt代表可以在頁面有多個不同email帳戶選擇
  });
  */
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

// 設定本地登入註冊帳號
router.post("/signup", async (req, res) => {
  let { name, email, password } = req.body;
  if (password.length < 8) {
    // 定義用flash的方式來提醒使用者
    req.flash(
      "error_msg",
      "password length is too short, at least 8 alphas or number."
    );
    return res.redirect("/auth/signup"); //若有錯誤 redirect 去signup介面
  }
  //確認email是否被使用過
  const foundEmail = await User.findOne({ email }).exec();
  if (foundEmail) {
    req.flash(
      "error_msg",
      "This email is already in use,pls login or type another email address."
    );
    return res.redirect("/auth/signup");
  }
  //若是新註冊帳號, 將密碼用bcrypt演算法加鹽(hash加密)
  let hashedPassword = await bcrypt.hash(password, 12);
  //將newUser存入資料庫
  let newUser = new User({ name, email, password: hashedPassword });
  newUser.save();
  req.flash("success_msg", "Registered successfully!, you can login now");
  return res.redirect("/auth/login"); //跳轉到登入頁面
});

//本地驗證登錄
router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/auth/login", //設定單入失敗後要導到哪裡
    failureFlash: "fail login!, email || password not correct.", // set failure flash
  }),
  (req, res) => {
    //驗證成功後要導向使用者介面
    return res.redirect("/profile");
  }
);

//設定通過google驗證後,要導向的頁面,記得加passport.authenticate("google")這個middleware 代表必要經過這個google驗證後,才能跳轉到此頁面
router.get("/google/redirect", passport.authenticate("google"), (req, res) => {
  console.log("step into redirect area");
  return res.redirect("/profile");
});

module.exports = router;
