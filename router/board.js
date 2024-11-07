// router이므로 express.Router() 인스턴스 생성
const express = require("express");
const router = express.Router();
const { errController } = require("../controller/Legacy/Tips/index");
const { BoardController } = require("../controller/board");

const {
  getKKBoardDataRead,
  postKKBoardDataCreate,
  postKKBoardDataUpdate,
  deleteKKBoardDataDelete,
} = BoardController;

router.get("/read", getKKBoardDataRead);
router.post("/create", postKKBoardDataCreate);
router.post("/update", postKKBoardDataUpdate);
router.delete("/:id", deleteKKBoardDataDelete);

// 에러 메세지 처리
router.use(errController.errMessageHandler);

// public 모듈화 - require(router/path)을 통해 인스턴스 생성 가능.
module.exports = router;
