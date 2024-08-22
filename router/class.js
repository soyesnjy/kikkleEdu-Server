// router이므로 express.Router() 인스턴스 생성
const express = require("express");
const router = express.Router();
const { errController } = require("../controller/index");
const { classController } = require("../controller/class");

const {
  getKKClassDataRead,
  postKKClassDataCreate,
  postKKClassDataUpdate,
  deleteKKClassDataDelete,
} = classController;

router.get("/", getKKClassDataRead);
router.post("/create", postKKClassDataCreate);
router.post("/update", postKKClassDataUpdate);
router.delete("/:id", deleteKKClassDataDelete);

// 에러 메세지 처리
router.use(errController.errMessageHandler);

// public 모듈화 - require(router/path)을 통해 인스턴스 생성 가능.
module.exports = router;
