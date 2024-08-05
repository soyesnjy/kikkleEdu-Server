// router이므로 express.Router() 인스턴스 생성
const express = require("express");
const router = express.Router();
const { errController } = require("../controller/index");
const {
  signupController,
  signupController_Regercy,
} = require("../controller/signup");
const { postSignupAIHandler } = signupController;
const { dupleCheckHandler, signupHandler } = signupController_Regercy;

router.post("/", signupHandler);
router.post("/duplecheck", dupleCheckHandler);

// AI 프로젝트용 회원가입 컨트롤러
router.post("/ai", postSignupAIHandler);

// 에러 메세지 처리
router.use(errController.errMessageHandler);

// public 모듈화 - require(router/path)을 통해 인스턴스 생성 가능.
module.exports = router;
