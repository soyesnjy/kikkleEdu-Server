// router이므로 express.Router() 인스턴스 생성
const express = require("express");
const router = express.Router();
const { errController } = require("../controller/index");
const { agoraTokenController } = require("../controller/index");

const { agoraTokenHandler } = agoraTokenController;

// 사전 헤더 처리 함수
const nocache = (req, res, next) => {
  res.header(
    "Cache-Control",
    "private",
    "no-cache",
    "no-store",
    "must-revalidate"
  );
  res.header("Expires", "-1");
  res.header("Pragma", "no-cache");
  next();
};

// agoraToken 사전 헤더 처리 (안써도 작동하길래 안 넣음)
// router.post("/", nocache);

// agoraToken 발급 처리
router.post("/", agoraTokenHandler);

// 에러 메세지 처리
router.use(errController.errMessageHandler);
// public 모듈화 - require(router/path)을 통해 인스턴스 생성 가능.
module.exports = router;
