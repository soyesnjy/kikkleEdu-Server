// router이므로 express.Router() 인스턴스 생성
const express = require("express");
const router = express.Router();
const { errController } = require("../controller/Legacy/Tips/index");
// const { loginController } = require("../controller/index");
const {
  loginController_KK,
  // loginController,
  // loginController_Regercy,
} = require("../controller/login");

// const {
//   // OAuth
//   oauthUrlHandler,
//   oauthKakaoUrlHandler,
//   oauthGoogleAccessTokenHandler,
//   oauthKakaoAccessTokenHandler,
//   // AI 일반 로그인
//   postAILoginHandler,
//   getAILogoutHandler,
//   postAIRefreshTokenUpdateHandler,
// } = loginController;

const {
  // 구글 로그인
  getKKoauthUrlHandler,
  postKKoauthGoogleAccessTokenHandler,
  // 카카오 로그인
  getKKoauthKakaoUrlHandler,
  postKKoauthKakaoAccessTokenHandler,
  // KK 일반 로그인
  postKKLoginHandler,
  getKKLogoutHandler,
} = loginController_KK;

// KK 일반 로그인
router.post("/kk", postKKLoginHandler);
// KK 일반 로그아웃
router.get("/kk/logout", getKKLogoutHandler);

// // Google OAuth_url 발급
// router.get("/oauth_url", getKKoauthUrlHandler);
// // Google OAuth AccessToken 발급
// router.post("/oauth_token/google", postKKoauthGoogleAccessTokenHandler);

// // Kakao OAuth_url 발급
// router.get("/oauth_url/kakao", getKKoauthKakaoUrlHandler);
// // Kakao OAuth AccessToken 발급
// router.post("/oauth_token/kakao", postKKoauthKakaoAccessTokenHandler);

// 에러 메세지 처리
router.use(errController.errMessageHandler);

// public 모듈화 - require(router/path)을 통해 인스턴스 생성 가능.
module.exports = router;
