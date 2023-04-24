const router = require("express").Router();
const Post = require("../models/post-model");
//驗證是否登入
const authCheck = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    return res.redirect("/auth/login");
  }
};

router.get("/", authCheck, async (req, res) => {
  console.log(" enter /profile");
  let postFound = await Post.find({ auther: req.user._id });
  try {
    if (!postFound) {
      req.flash("error_msg", "no post found, pls add new post");
      return res.redirect("/post");
    } else {
      return res.render("profile", { user: req.user, posts: postFound }); //因為deserializUser()當中的done已設定req.user = 去資料庫依_id找到的使用者資料
    }
  } catch (e) {
    req.flash("error_msg", "no post found, pls add new post");
    return res.redirect("/post");
  }
});

//製作new post頁面
router.get("/post", authCheck, (req, res) => {
  return res.render("post", { user: req.user });
});

//製作new post頁面
router.post("/post", authCheck, async (req, res) => {
  let { title, content } = req.body;
  let newPost = new Post({
    title,
    content,
    auther: req.user._id,
  });
  try {
    await newPost.save();
    return res.redirect("/profile");
  } catch (e) {
    req.flash("error_msg", "Both tilte & content are needed");
    return res.redirect("/profile/post");
  }
});

module.exports = router;
