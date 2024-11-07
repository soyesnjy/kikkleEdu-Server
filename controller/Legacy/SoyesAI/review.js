// MySQL 접근
const mysql = require("mysql");
const { dbconfig_ai } = require("../DB/database");

// AI DB 연결
const connection_AI = mysql.createConnection(dbconfig_ai);
connection_AI.connect();

const { Review_Table_Info } = require("../DB/database_table_info");

const reviewController = {
  // ReviewData READ
  getReviewDataRead: (req, res) => {
    console.log("ReviewData READ API 호출");
    try {
      // 클라이언트로부터 페이지 번호 받기 (기본값: 1)
      const page = req.query.page || 1;
      const limit = 10; // 한 페이지에 보여줄 리뷰의 수
      const offset = (page - 1) * limit;

      const review_table = Review_Table_Info.table;
      // const review_attribute = Review_Table_Info.attribute;
      // const select_column = Object.values(review_attribute).join(", ");

      // SQL 쿼리 준비: 최신순으로 리뷰 데이터 가져오기
      const select_query = `SELECT * FROM ${review_table} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      const select_values = [limit, offset];
      // 데이터베이스 쿼리 실행
      connection_AI.query(select_query, select_values, (err, data) => {
        if (err) {
          console.log(err);
          return;
        }
        // 결과 반환
        res.json({
          page,
          limit,
          reviewData: data,
        });
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server Error - 500" });
    }
  },
  // ReviewData CREATE
  postReviewDataCreate: (req, res) => {
    console.log("ReviewData CREATE API 호출");
    const { ReviewData } = req.body;
    let parseReviewData, parsepUid;
    try {
      // 파싱. Client JSON 데이터
      if (typeof ReviewData === "string") {
        parseReviewData = JSON.parse(ReviewData);
      } else parseReviewData = ReviewData;

      const { pUid, profile_img_url, content } = parseReviewData;
      parsepUid = pUid;

      const review_table = Review_Table_Info.table;
      const review_attribute = Review_Table_Info.attribute;

      // Consult_Log DB 저장
      const review_insert_query = `INSERT INTO ${review_table} (${Object.values(
        review_attribute
      ).join(", ")}) VALUES (${Object.values(review_attribute)
        .map((el) => "?")
        .join(", ")})`;
      // console.log(consult_insert_query);

      const review_insert_value = [parsepUid, profile_img_url, content];
      // console.log(consult_insert_value);

      connection_AI.query(review_insert_query, review_insert_value, (err) => {
        if (err) {
          console.log("Review_Log DB Save Fail!");
          console.log("Err sqlMessage: " + err.sqlMessage);
          res.json({ message: "Err sqlMessage: " + err.sqlMessage });
        } else {
          console.log("Review_Log DB Save Success!");
          res.status(200).json({ message: "Review_Log DB Save Success!" });
        }
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server Error - 500" });
    }
  },
  // ReviewData UPDATE
  postReviewDataUpdate: (req, res) => {
    console.log("ReviewData UPDATE API 호출");
    const { ReviewData } = req.body;
    let parseReviewData, parseEnteyID, parseContent;
    try {
      // 파싱. Client JSON 데이터
      if (typeof ReviewData === "string") {
        parseReviewData = JSON.parse(ReviewData);
      } else parseReviewData = ReviewData;

      const { content, entry_id } = parseReviewData;
      parseEnteyID = entry_id;
      parseContent = content;

      // 오늘 날짜 변환
      const dateObj = new Date();
      const year = dateObj.getFullYear();
      const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
      const day = ("0" + dateObj.getDate()).slice(-2);
      const date = `${year}-${month}-${day}`;

      // Review 테이블 및 속성 명시
      const review_table = Review_Table_Info.table;
      const review_attribute = Review_Table_Info.attribute;
      const review_pKey = "entry_id";

      // Query 명시. (Review 존재 확인용 Select Query)
      const review_select_query = `SELECT ${review_pKey} FROM ${review_table} WHERE ${review_pKey} = ${parseEnteyID}`;

      // Select Query
      connection_AI.query(review_select_query, [], (err, data) => {
        if (err) {
          console.log("Review_Log DB Select Fail!");
          console.log("Err sqlMessage: " + err.sqlMessage);
        } else {
          // entry_id에 해당되는 Review가 있을 경우
          if (data[0]) {
            // Review 갱신용 Update Query
            const review_update_query = `UPDATE ${review_table} SET ${review_attribute.attr2} = ? WHERE ${review_pKey} = ?`;
            const review_update_value = [parseContent, parseEnteyID];
            // Update Query
            connection_AI.query(
              review_update_query,
              review_update_value,
              (err) => {
                if (err) {
                  console.log("Review_Log DB Update Fail!");
                  console.log("Err sqlMessage: " + err.sqlMessage);
                } else {
                  console.log("Review_Log DB Update Success!");
                  res
                    .status(200)
                    .json({ message: "Review_Log DB Update Success!" });
                }
              }
            );
          }
          // entry_id에 해당되는 Review가 없을 경우
          else {
            console.log("Review_Log DB Non Review!");
            res.status(400).json({ message: "Review_Log DB Non Review!" });
          }
        }
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server Error - 500" });
    }
  },
  // ReviewData DELETE
  deleteReviewDataDelete: (req, res) => {
    console.log("ReviewData DELETE API 호출");
    const { id } = req.params;

    try {
      const review_table = Review_Table_Info.table;
      const delete_query = `DELETE FROM ${review_table} WHERE entry_id = ?`;

      connection_AI.query(delete_query, [id], (err) => {
        if (err) {
          console.log("Review_Log DB Delete Fail!");
          console.log("Err sqlMessage: " + err.sqlMessage);
          res.json({ message: "Err sqlMessage: " + err.sqlMessage });
        } else {
          console.log("Review_Log DB Delete Success!");
          res.status(200).json({ message: "Review_Log DB Delete Success!" });
        }
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server Error - 500" });
    }
  },
};

module.exports = {
  reviewController,
};
