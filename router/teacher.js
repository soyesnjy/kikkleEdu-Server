// router이므로 express.Router() 인스턴스 생성
const express = require("express");
const router = express.Router();
const { errController } = require("../controller/index");
const { teacherController } = require("../controller/teacher");

const {
  getKKTeacherDataRead,
  postKKTeacherDataCreate,
  postKKTeacherDataUpdate,
  deleteKKTeacherDataDelete,
} = teacherController;

router.get("/", getKKTeacherDataRead);
router.post("/create", postKKTeacherDataCreate);
router.post("/update", postKKTeacherDataUpdate);
router.delete("/:id", deleteKKTeacherDataDelete);

// 에러 메세지 처리
router.use(errController.errMessageHandler);

// public 모듈화 - require(router/path)을 통해 인스턴스 생성 가능.
module.exports = router;
