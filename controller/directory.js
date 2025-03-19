const stream = require("stream");
const util = require("util");
// MySQL 접근
const mysql = require("mysql");
const { dbconfig_ai, dbconfig_kk } = require("../DB/database");
// AI DB 연결
// const connection_AI = mysql.createConnection(dbconfig_ai);
// connection_AI.connect();

// 키클 DB 연결
const connection_KK = mysql.createConnection(dbconfig_kk);
connection_KK.connect();

// 쿼리 실행을 Promise로 변환
const query = util.promisify(connection_KK.query).bind(connection_KK);

// const { Review_Table_Info } = require("../DB/database_table_info");

// 구글 권한 관련
const { google } = require("googleapis");

// google OAuth2Client 설정

// GCP IAM 서비스 계정 인증
const serviceAccount = {
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.GOOGLE_CLIENT_EMAIL, // GCP IAM 계정 Email
  project_id: process.env.GOOGLE_PROJECT_ID, // GCP Project ID
};

const auth_google_drive = new google.auth.JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ["https://www.googleapis.com/auth/drive"], // 사용 영역 설정(Google Drive API 전체)
});

const drive = google.drive({ version: "v3", auth: auth_google_drive });

// google drive 파일 전체 조회 메서드
async function listFiles() {
  try {
    const res = await drive.files.list({
      pageSize: 10,
      fields: "nextPageToken, files(id, name)",
    });

    const files = res.data.files;
    if (files.length) {
      console.log("Files:");
      files.map((file) => {
        console.log(`${file.name} (${file.id})`);
      });
    } else {
      console.log("No files found.");
    }
  } catch (error) {
    console.error(`An error occurred: ${error}`);
  }
}
// listFiles();

// google drive 파일 전체 삭제 메서드
async function deleteAllFiles() {
  try {
    // 파일 목록 가져오기
    const res = await drive.files.list({
      pageSize: 1000, // 한 번에 최대 1000개의 파일 가져오기
      fields: "files(id, name)",
    });

    const files = res.data.files;
    if (files.length === 0) {
      console.log("No files found.");
      return;
    }

    // 파일 삭제
    for (const file of files) {
      try {
        await drive.files.delete({ fileId: file.id });
        console.log(`Deleted file: ${file.name} (${file.id})`);
      } catch (error) {
        console.error(
          `Failed to delete file: ${file.name} (${file.id})`,
          error.message
        );
      }
    }

    console.log("All files deleted successfully.");
  } catch (error) {
    console.error("An error occurred while deleting files:", error.message);
  }
}
// deleteAllFiles();

// 동기식 DB 접근 함수 1. Promise 생성 함수
function queryAsync(connection, query, parameters) {
  return new Promise((resolve, reject) => {
    connection.query(query, parameters, (error, results, fields) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}
// 프로미스 resolve 반환값 사용. (User Data return)
async function fetchUserData(connection, query) {
  try {
    let results = await queryAsync(connection, query, []);
    // console.log(results[0]);
    return results;
  } catch (error) {
    console.error(error);
  }
}

// Google Drive Music,Class 파일 저장 함수
const fileDriveSave = async (fileData) => {
  try {
    // 첨부파일 Google Drive 저장
    const { fileName, fileType, baseData } = fileData;
    const [_, zipBase64] = baseData.split(",");
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

    // 특정 계정에게 파일 공유 설정 (writer 권한)
    // await drive.permissions.create({
    //   fileId: file.data.id,
    //   requestBody: {
    //     role: "writer",
    //     type: "user",
    //     emailAddress: "soyesnjy@gmail.com",
    //   },
    // });

    // Public URL을 가져오기 위해 파일 정보를 다시 가져옴
    const uploadFile = await drive.files.get({
      fileId: file.data.id,
      fields: "id, webViewLink, webContentLink",
    });

    return uploadFile;
  } catch (error) {
    console.error("Error saving file to Google Drive:", error.message);
    throw new Error("Failed to save file to Google Drive.");
  }
};

// // (구) Google Drive Video 파일 저장 함수
// const fileVideoDriveSave = async (file, fileName, mimeType) => {
//   try {
//     const bufferStream = new stream.PassThrough();
//     bufferStream.end(file.buffer);

//     const fileMetadata = { name: fileName };
//     const media = { mimeType: mimeType, body: bufferStream };

//     // Google Drive에 파일 업로드
//     const createResponse = await drive.files.create({
//       requestBody: fileMetadata,
//       media: media,
//       fields: "id, webViewLink, webContentLink",
//       uploadType: "resumable", // Resumable Upload 사용
//     });

//     // Public 권한 설정
//     await drive.permissions.create({
//       fileId: createResponse.data.id,
//       requestBody: { role: "reader", type: "anyone" },
//     });

//     return createResponse.data;
//   } catch (error) {
//     console.error("Google Drive 업로드 중 오류 발생:", error);
//     throw new Error("Google Drive 업로드 실패");
//   }
// };

const getSubDirectoriesAndFiles = async (parentId) => {
  const subItems = [];

  try {
    // 하위 디렉터리와 파일을 조회
    const rows = await query(
      `SELECT kk_directory_idx, kk_directory_type
       FROM kk_directory 
       WHERE kk_directory_parent_idx = ?`,
      [parentId]
    );

    for (const row of rows) {
      // 파일인 경우 kk_file 테이블 데이터 삭제
      if (row.kk_directory_type === "file") {
        const fileRows = await query(
          `SELECT kk_file_data_id 
           FROM kk_file 
           WHERE kk_directory_idx = ?`,
          [row.kk_directory_idx]
        );
        // Google Drive 파일 삭제용 FileID 누적
        subItems.push({
          ...row,
          files: fileRows.map((file) => file.kk_file_data_id),
        });
      } else if (row.kk_directory_type === "directory") {
        // 하위 디렉터리 검색 (재귀 호출)
        const subDirectoryItems = await getSubDirectoriesAndFiles(
          row.kk_directory_idx
        );
        subItems.push(...subDirectoryItems);
      }
    }

    return subItems;
  } catch (error) {
    console.error("Error fetching directories and files:", error);
    throw error;
  }
};

const directoryController = {
  // (New) Directory READ - form + parentIdx 해당되는 데이터만 반환
  getDirectoryDataRead: async (req, res) => {
    const { form, parentIdx, adminForm } = req.query; // 특정 부모 디렉토리를 기준으로 조회
    // console.log(req.query);
    try {
      // 특정 폴더의 하위 디렉토리 조회
      const directories = await fetchUserData(
        connection_KK,
        `SELECT
        kk_directory_idx,
        ${adminForm ? "kk_directory_parent_idx," : ""}
        kk_directory_name,
        kk_directory_type
        FROM kk_directory
        WHERE kk_directory_form = '${form}'
        ${
          // AdminPage => All Data Response
          adminForm
            ? ""
            : // TeacherMyPage => parentIdx Directory Data Response
            parentIdx
            ? `AND kk_directory_parent_idx = ${parentIdx}`
            : "AND kk_directory_parent_idx IS NULL"
        }
        `
      );
      // 해당 폴더의 파일 조회
      const tracks = await fetchUserData(
        connection_KK,
        `SELECT 
        kk_directory_idx,
        kk_file_path
        FROM kk_file
        WHERE kk_directory_idx IN (${
          directories.map((dir) => dir.kk_directory_idx).join(",") || "NULL"
        })`
      );

      const formattedData = directories.map((dir) => ({
        ...dir,
        // 파일인 경우 url 속성 추가
        url:
          dir.kk_directory_type === "file"
            ? tracks.find(
                (track) => track.kk_directory_idx === dir.kk_directory_idx
              )?.kk_file_path
            : null,
      }));

      // console.log(formattedData);
      return res.status(200).json({ directories: formattedData });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
  // Directory Music,Class File CREATE
  postDirectoryDataCreate: async (req, res) => {
    // console.log("KK Directory CREATE API 호출");
    let parseData;
    try {
      const { data } = req.body;
      // json 파싱
      if (typeof data === "string") {
        parseData = JSON.parse(data);
      } else parseData = data;
      // console.log(parseData);

      const { type } = parseData;

      // file 생성인 경우
      if (type === "file") {
        const { fileData, directoryId, form } = parseData;

        const file = await fileDriveSave(fileData);
        const fileUrl = `https://drive.google.com/file/d/${file.data.id}/preview`; // 미리보기 URL 형식 저장

        connection_KK.query(
          "INSERT INTO kk_directory (kk_directory_name, kk_directory_parent_idx, kk_directory_type, kk_directory_form) VALUES (?, ?, ?, ?)",
          [fileData.fileName, directoryId, "file", form],
          (error, results) => {
            if (error) {
              console.error(error.sqlMessage);
              return res
                .status(400)
                .json({ message: "kk_directory INSERT Error" });
            }
            const fileId = results.insertId;

            connection_KK.query(
              "INSERT INTO kk_file (kk_directory_idx, kk_file_path, kk_file_name, kk_file_data_id, kk_file_form) VALUES (?, ?, ?, ?, ?)",
              [
                fileId,
                fileUrl,
                fileData.fileName,
                file.data.id,
                form || "music",
              ],
              (error) => {
                if (error) {
                  console.error("Database error:", error);
                  return res
                    .status(400)
                    .json({ message: "kk_file INSERT Error" });
                }
                return res.status(200).json({
                  id: fileId,
                  name: fileData.fileName,
                  parent_id: directoryId,
                  type: "file",
                  url: fileUrl,
                });
              }
            );
          }
        );
      }
      // Directory 생성인 경우
      else if (type === "directory") {
        const { directoryName, directoryId, type, form } = parseData;

        connection_KK.query(
          "INSERT INTO kk_directory (kk_directory_name, kk_directory_parent_idx, kk_directory_type, kk_directory_form) VALUES (?, ?, ?, ?)",
          [directoryName, directoryId || null, type, form],
          (error, results) => {
            if (error) {
              console.error("Database error:", error);
              return res.status(500).json({ message: "Database error" });
            }
            const directoryId = results.insertId;
            return res.status(200).json({
              id: directoryId,
              name: directoryName,
              parent_id: directoryId,
              type: "directory",
            });
          }
        );
      }
    } catch (error) {
      console.log(error);
      res.status(500).send(error.message);
    }
  },
  // Video File CREATE V2
  postDirectoryVideoFileDataCreateV2: async (req, res) => {
    // console.log("KK Video File CREATE V2 API 호출");
    let parseData;
    try {
      const { data } = req.body;
      // json 파싱
      if (typeof data === "string") {
        parseData = JSON.parse(data);
      } else parseData = data;
      // console.log(parseData);

      const { fileName, fileCode, directoryId, form } = parseData;

      const fileUrl = `https://drive.google.com/file/d/${fileCode}/preview`;

      connection_KK.query(
        "INSERT INTO kk_directory (kk_directory_name, kk_directory_parent_idx, kk_directory_type, kk_directory_form) VALUES (?, ?, ?, ?)",
        [fileName, directoryId, "file", form],
        (error, results) => {
          if (error) {
            console.error(error.sqlMessage);
            return res
              .status(400)
              .json({ message: "kk_directory INSERT Error" });
          }
          const fileId = results.insertId;

          connection_KK.query(
            "INSERT INTO kk_file (kk_directory_idx, kk_file_path, kk_file_name, kk_file_data_id, kk_file_form) VALUES (?, ?, ?, ?, ?)",
            [fileId, fileUrl, fileName, fileCode, form],
            (error) => {
              if (error) {
                console.error("Database error:", error);
                return res
                  .status(400)
                  .json({ message: "kk_file INSERT Error" });
              }
              return res.status(200).json({
                id: fileId,
                name: fileName,
                parent_id: directoryId,
                type: "file",
                url: fileUrl,
              });
            }
          );
        }
      );
    } catch (error) {
      console.log(error);
      res.status(500).send(error.message);
    }
  },
  // Directory DELETE
  deleteDirectoryDataDelete: async (req, res) => {
    // console.log("KK Directory DELETE API 호출");
    const { directoryIdx, type, form } = req.query;
    try {
      // Drive Data Delete
      // 파일인 경우
      if (type === "file") {
        const select_data = await query(
          `SELECT kk_file_data_id
           FROM kk_file 
           WHERE kk_directory_idx = ?`,
          [directoryIdx]
        );
        // form 값이 video가 아닌 경우
        if (form !== "video")
          await drive.files.delete({ fileId: select_data[0].kk_file_data_id });
        // console.log("drive data delete complete");
      }
      // 폴더인 경우
      else if (type === "directory") {
        const itemsToDelete = await getSubDirectoriesAndFiles(directoryIdx);
        // Google Drive 파일 삭제
        if (form !== "video") {
          for (const item of itemsToDelete) {
            if (item.kk_directory_type === "file" && item.files) {
              for (const fileId of item.files) {
                await drive.files.delete({ fileId: fileId });
              }
            }
          }
        }
      }

      // DB Table Data Delete
      const delete_query = `DELETE FROM kk_directory WHERE kk_directory_idx = ?`;
      connection_KK.query(delete_query, [directoryIdx], async (err) => {
        if (err) {
          console.log(err);
          return res.status(400).json({ message: err.sqlMessage });
        }
        // await drive.files.delete({ fileId: file.id });

        // console.log("Directory DB Delete Success!");
        return res
          .status(200)
          .json({ message: "Directory DB Delete Success!" });
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server Error - 500" });
    }
  },

  // (구) Directory READ - form 해당되는 모든 데이터 반환
  // getDirectoryDataRead: async (req, res) => {
  //   const { form } = req.query; // music, video, class
  //   try {
  //     // 폴더정보 조회
  //     const directories = await fetchUserData(
  //       connection_KK,
  //       `SELECT * FROM kk_directory WHERE kk_directory_form = '${form}'`
  //     );
  //     // 파일정보 조회
  //     const tracks = await fetchUserData(
  //       connection_KK,
  //       `SELECT * FROM kk_file WHERE kk_file_form = '${form}' ORDER BY kk_file_name ASC`
  //     );
  //     // console.log({ directories, tracks }); // 로그
  //     return res.status(200).json({ directories, tracks });
  //   } catch (error) {
  //     console.log(error);
  //     return res.status(500).json({ error: "Internal Server Error" });
  //   }
  // },

  // // (구) Video File CREATE
  // postDirectoryVideoFileDataCreate: async (req, res) => {
  //   // console.log("KK Video File CREATE API 호출");
  //   const file = req.file;
  //   const { form, directoryId, fileName } = req.body;
  //   try {
  //     if (!file) {
  //       return res.status(400).json({ message: "업로드된 파일이 없습니다." });
  //     }
  //     // Google Drive에 파일 업로드
  //     const uploadedFile = await fileVideoDriveSave(
  //       file,
  //       file.originalname,
  //       file.mimetype
  //     );
  //     // iframe 미리보기용 링크
  //     const fileUrl = `https://drive.google.com/file/d/${uploadedFile.id}/preview`;
  //     // DB 저장
  //     connection_KK.query(
  //       "INSERT INTO kk_directory (kk_directory_name, kk_directory_parent_idx, kk_directory_type, kk_directory_form) VALUES (?, ?, ?, ?)",
  //       [fileName, directoryId, "file", form],
  //       (error, results) => {
  //         if (error) {
  //           console.error(error.sqlMessage);
  //           return res
  //             .status(400)
  //             .json({ message: "kk_directory INSERT Error" });
  //         }
  //         const fileId = results.insertId;
  //         connection_KK.query(
  //           "INSERT INTO kk_file (kk_directory_idx, kk_file_path, kk_file_name, kk_file_data_id, kk_file_form) VALUES (?, ?, ?, ?, ?)",
  //           [fileId, fileUrl, fileName, uploadedFile.id, form],
  //           (error) => {
  //             if (error) {
  //               console.error("Database error:", error);
  //               return res
  //                 .status(400)
  //                 .json({ message: "kk_file INSERT Error" });
  //             }
  //             return res.status(200).json({
  //               id: fileId,
  //               name: fileName,
  //               parent_id: directoryId,
  //               type: "file",
  //               url: fileUrl,
  //             });
  //           }
  //         );
  //       }
  //     );
  //   } catch (error) {
  //     console.log(error);
  //     res.status(500).send(error.message);
  //   }
  // },

  // // TODO# Directory UPDATE
  // postDirectoryDataUpdate: (req, res) => {
  //   // console.log("ReviewData UPDATE API 호출");
  //   const { ReviewData } = req.body;
  //   let parseReviewData, parseEnteyID, parseContent;
  //   try {
  //     // 파싱. Client JSON 데이터
  //     if (typeof ReviewData === "string") {
  //       parseReviewData = JSON.parse(ReviewData);
  //     } else parseReviewData = ReviewData;

  //     const { content, entry_id } = parseReviewData;
  //     parseEnteyID = entry_id;
  //     parseContent = content;

  //     // 오늘 날짜 변환
  //     // const dateObj = new Date();
  //     // const year = dateObj.getFullYear();
  //     // const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
  //     // const day = ("0" + dateObj.getDate()).slice(-2);
  //     // const date = `${year}-${month}-${day}`;

  //     // Review 테이블 및 속성 명시
  //     const review_table = Review_Table_Info.table;
  //     const review_attribute = Review_Table_Info.attribute;
  //     const review_pKey = "entry_id";

  //     // Query 명시. (Review 존재 확인용 Select Query)
  //     const review_select_query = `SELECT ${review_pKey} FROM ${review_table} WHERE ${review_pKey} = ${parseEnteyID}`;

  //     // Select Query
  //     connection_KK.query(review_select_query, [], (err, data) => {
  //       if (err) {
  //         console.log("Review_Log DB Select Fail!");
  //         console.log("Err sqlMessage: " + err.sqlMessage);
  //       } else {
  //         // entry_id에 해당되는 Review가 있을 경우
  //         if (data[0]) {
  //           // Review 갱신용 Update Query
  //           const review_update_query = `UPDATE ${review_table} SET ${review_attribute.attr2} = ? WHERE ${review_pKey} = ?`;
  //           const review_update_value = [parseContent, parseEnteyID];
  //           // Update Query
  //           connection_KK.query(
  //             review_update_query,
  //             review_update_value,
  //             (err) => {
  //               if (err) {
  //                 console.log("Review_Log DB Update Fail!");
  //                 console.log("Err sqlMessage: " + err.sqlMessage);
  //               } else {
  //                 console.log("Review_Log DB Update Success!");
  //                 res
  //                   .status(200)
  //                   .json({ message: "Review_Log DB Update Success!" });
  //               }
  //             }
  //           );
  //         }
  //         // entry_id에 해당되는 Review가 없을 경우
  //         else {
  //           console.log("Review_Log DB Non Review!");
  //           res.status(400).json({ message: "Review_Log DB Non Review!" });
  //         }
  //       }
  //     });
  //   } catch (err) {
  //     console.log(err);
  //     res.status(500).json({ message: "Server Error - 500" });
  //   }
  // },
};

module.exports = {
  directoryController,
};
