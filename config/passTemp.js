// 把會用到的strategy都寫在這邊
//在此以google和本地登入的strategy為例
const passport = require("passport"); //驗證套件
const GoogleStrategy = require("passport-google-oauth20"); //google auth 套件(一個class)
const User = require("../models/user-model");
const LocalSrategy = require("passport-local"); // 驗證本地登入套件
const bcrypt = require("bcrypt");

/*
序列化使用者, 這裡的user參數 = GoogleStrategy裡的done函數的第二個參數
而當passport.serializeUser((user, done)中的done函數被執行時
會將此done(參數)的第二參數值放入session, 並在用戶端瀏覽器設定cookie
serializeUser((user, done) 用處就是將使用者資料加密後存到session然後簽名後以cookie回傳給使用者端*/
passport.serializeUser((user, done) => {
  console.log("序列化使用者。。。, user");
  /*
user._id = foundUser._id <= 將mongoDB中的_id存在session中
並且將id簽名後,以cookie形式回傳給用戶端瀏覽器
並且設定 req.isAuthenticated() = true, 代表登入資料已驗證*/
  done(null, user._id);
});

// 第一個參數_id會自動存取serializeUser中得到的特定使用者mongoDB _id
passport.deserializeUser(async (_id, done) => {
  console.log(
    "Deserialize使用者...使用serializeUser儲存的id,去找到資料庫內的資料"
  );
  //設定foundUser為此函數利用_id去database找到的使用者資料
  let foundUser = await User.findOne({ _id });
  done(null, foundUser); //這個done功能是將req.user屬性設定為foundUser
});

//要use那個方式來進行登入驗證(這邊用google)
passport.use(
  //用GoogleStrategy constructor來new一個物件作為參數
  new GoogleStrategy(
    {
      // 去env裡帶入在google cloud設定的客戶端(也就是你的網站)的id與secret
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      //這個是設定驗證成功serializeUser後要redirect的頁面
      callbackURL: "/auth/google/redirect",
    },
    /*
    passport.use第二個參數定義取得用戶的資料後要執行的function...
    這function包含4個參數分別為 從google拿到的accessToken, refresh token(不用管), 
    profile(passport從google拿到的用戶資料),done(存資料用)
    這個func用來判斷此用戶是否是第一次進入系統, 若是, 則將從google取得的用戶資料
    存到客戶端(我們網站)的資料庫*/
    async (accessToken, refreshToken, profile, done) => {
      console.log("get into google strategy area.");
      // console.log(accessToken); //google給的accessToken
      // console.log(profile); // 從google獲取的資料
      // console.log("==========================");
      try {
        //查詢使用者是否已存在客戶端資料庫中
        let foundUser = await User.findOne({ googleID: profile.id }).exec();
        if (foundUser) {
          console.log("people already registered");
          //console.log(foundUser);
          /*
          執行done函數會自動執行passport.serializeUser() <-將id轉成bytes儲存
          第一個參數null是默認規定的, 第二個參數(foundUser)會被
          自動帶入passport.serializeUser((user, done)當作第一個參數
          也就是說這裡的user = foundUser*/
          done(null, foundUser);
        } else {
          console.log("new user! need to store data to database");
          let newUser = new User({
            name: profile.displayName,
            googleID: profile.id,
            thumbnail: profile.photos[0].value,
            email: profile.emails[0].value,
          });
          let savedUser = await newUser.save();
          console.log("successfully create new user:");
          done(null, savedUser);
        }
      } catch (e) {
        console.log(e);
      }
    }
  )
);

//login.ejs中屬性name="username", name="password" 一定要設定成左述這樣, 才能被成功套到這邊
passport.use(
  new LocalSrategy(async (username, password, done) => {
    let foundUser = await User.findOne({ email: username });
    if (foundUser) {
      //找到相符使用者後, 比對使用者輸入密碼(password)與資料庫內儲存密碼(foundUser.password)是否相符
      let result = await bcrypt.compare(password, foundUser.password);
      if (result) {
        done(null, foundUser); //驗證成功後,將foundUser當成參數執行serializeUser(),serializeUser()動作       }
      } else {
        done(null, false); // 若驗證失敗執行done函式,只要設定成false代表沒有被驗證成功
      }
    }
  })
);
