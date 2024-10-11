// router이므로 express.Router() 인스턴스 생성
const express = require("express");
const router = express.Router();

const { errController } = require("../controller/index");
const { directoryController } = require("../controller/directory");

const {
  getDirectoryDataRead,
  postDirectoryDataCreate,
  // postDirectoryVideoFileDataCreate,
  postDirectoryVideoFileDataCreateV2,
  deleteDirectoryDataDelete,
} = directoryController;

router.get("/", getDirectoryDataRead);
router.post("/create", postDirectoryDataCreate);
router.post("/create/video", postDirectoryVideoFileDataCreateV2);
router.delete("/delete", deleteDirectoryDataDelete);

// const multer = require("multer");
// const upload = multer({ storage: multer.memoryStorage() }); // 메모리 스토리지 사용

// router.post(
//   "/create/video",
//   upload.single("file"),
//   postDirectoryVideoFileDataCreate
// );

// 에러 메세지 처리
router.use(errController.errMessageHandler);

// public 모듈화 - require(router/path)을 통해 인스턴스 생성 가능.
module.exports = router;
