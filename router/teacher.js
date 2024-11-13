// router이므로 express.Router() 인스턴스 생성
const express = require("express");
const router = express.Router();
const { errController } = require("../controller/Legacy/Tips/index");
const { teacherController } = require("../controller/teacher");
const { loginController_KK } = require("../controller/login");

const { getKKTeacherDataRead } = teacherController;
const { vaildateKKTokenCheck } = loginController_KK;

router.get(
  "/",
  // 조건부 토큰 체크
  (req, res, next) => {
    const query = req.query;
    const { main, classType } = query;
    // 메인 or 기관 페이지에서 호출할 경우 토큰 체크 X
    if (main || classType) {
      next();
      return;
    }
    // 그 외 토큰 체크
    vaildateKKTokenCheck(req, res, next);
  },
  getKKTeacherDataRead
);

// 에러 메세지 처리
router.use(errController.errMessageHandler);

// public 모듈화 - require(router/path)을 통해 인스턴스 생성 가능.
module.exports = router;
