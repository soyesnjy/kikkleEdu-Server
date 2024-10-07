// MySQL 접근
const mysql = require("mysql");
const { dbconfig_kk } = require("../DB/database");

// 키클 DB 연결
const connection_KK = mysql.createConnection(dbconfig_kk);
connection_KK.connect();

// 구글 권한 관련
const { google } = require("googleapis");

// GCP IAM 서비스 계정 인증
const serviceAccount = {
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  project_id: process.env.GOOGLE_PROJECT_ID,
};

const auth_google_drive = new google.auth.JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth: auth_google_drive });

const {
  Review_Table_Info,
  KK_User_Table_Info,
} = require("../DB/database_table_info");

const fileDriveSave = async (fileData) => {
  // 첨부파일 Google Drive 저장
  const { fileName, fileType, baseData } = fileData;
  const [baseType, zipBase64] = baseData.split(",");
  const bufferStream = new stream.PassThrough();
  bufferStream.end(Buffer.from(zipBase64, "base64"));

  const fileMetadata = {
    name: fileName,
  };

  const media = {
    mimeType: fileType,
    body: bufferStream,
  };

  // 파일 업로드
  const file = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: "id, webViewLink, webContentLink",
  });

  // 파일을 Public으로 설정
  await drive.permissions.create({
    fileId: file.data.id,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  // soyesnjy@gmail.com 계정에게 파일 공유 설정 (writer 권한)
  await drive.permissions.create({
    fileId: file.data.id,
    requestBody: {
      role: "writer",
      type: "user",
      emailAddress: "soyesnjy@gmail.com",
    },
    // transferOwnership: true, // role:'owner' 일 경우
  });

  // Public URL을 가져오기 위해 파일 정보를 다시 가져옴
  const uploadFile = await drive.files.get({
    fileId: file.data.id,
    fields: "id, webViewLink, webContentLink",
  });

  return uploadFile;
};

const classController = {
  // KKClass Data READ
  getKKClassDataRead: (req, res) => {
    // console.log("KK Class Data READ API 호출");
    try {
      const query = req.query;
      const { classType, classTag, classDetail } = query; // classDetail: 교육 페이지 식별자
      const class_table = KK_User_Table_Info["class"].table;

      // SQL 쿼리 준비: 최신순으로 class 데이터 가져오기
      // 2024.08.22: query 조회 기능 추가
      const select_query = `SELECT 
      kk_class_idx,
      kk_class_title,
      ${classDetail ? "kk_class_content," : ""}
      ${classDetail ? "kk_class_detail_path," : ""}
      kk_class_file_path
      FROM ${class_table}
      ${classType ? `WHERE kk_class_type LIKE '%${classType}%'` : ""}
      ${classTag ? `WHERE kk_class_tag = '${classTag}'` : ""}
      ORDER BY kk_class_created_at ASC`;

      // 데이터베이스 쿼리 실행
      connection_KK.query(select_query, null, (err, data) => {
        if (err) {
          console.log(err.sqlMessage);
          return res.status(404).json({
            message: err.sqlMessage,
          });
        }
        // 결과 반환
        return res.status(200).json({
          message: "class_table Access Success! - 200 OK",
          data,
        });
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server Error - 500" });
    }
  },
  // KKClass Data CREATE
  postKKClassDataCreate: async (req, res) => {
    console.log("KKClass Data CREATE API 호출");
    const { data } = req.body;
    let parseData, parsepUid;
    try {
      // 파싱. Client JSON 데이터
      if (typeof data === "string") {
        parseData = JSON.parse(data);
      } else parseData = data;

      const {
        kk_class_title,
        kk_class_content,
        kk_class_type,
        kk_class_tag,
        fileData,
      } = parseData;
      parsepUid = pUid;

      // 파일 저장 메서드 호출
      const uploadFile = await fileDriveSave(fileData);

      const class_table = KK_User_Table_Info["class"].table;
      // const class_attribute = KK_User_Table_Info["class"].attribute;

      // Consult_Log DB 저장
      const class_insert_query = `INSERT INTO ${class_table} (kk_class_title, kk_class_content, kk_class_type, kk_class_tag, kk_class_file_path) VALUES (?, ?, ?, ?, ?)`;
      // console.log(consult_insert_query);

      const class_insert_value = [
        kk_class_title,
        kk_class_content,
        kk_class_type,
        kk_class_tag,
        `https://lh3.google.com/u/0/d/${uploadFile.data.id}`,
      ];
      // console.log(consult_insert_value);

      connection_KK.query(class_insert_query, class_insert_value, (err) => {
        if (err) {
          console.log("Err sqlMessage: " + err.sqlMessage);
          res.json({ message: "Err sqlMessage: " + err.sqlMessage });
        } else {
          console.log("KKClass Data DB Save Success!");
          res.status(200).json({ message: "KKClass Data DB Save Success!" });
        }
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server Error - 500" });
    }
  },
  // TODO# KKClass Data UPDATE
  postKKClassDataUpdate: (req, res) => {
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
      connection_KK.query(review_select_query, [], (err, data) => {
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
            connection_KK.query(
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
  // TODO# KKClass Data DELETE
  deleteKKClassDataDelete: (req, res) => {
    console.log("ReviewData DELETE API 호출");
    const { id } = req.params;

    try {
      const review_table = Review_Table_Info.table;
      const delete_query = `DELETE FROM ${review_table} WHERE entry_id = ?`;

      connection_KK.query(delete_query, [id], (err) => {
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
  classController,
};
