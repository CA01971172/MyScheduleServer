// expressモジュールのインポート
import express, { Express, Request, Response } from 'express'
import cors from 'cors';
import bodyParser from 'body-parser';
// firebaseモジュールのインポート
import admin from "firebase-admin";


// expressの初期化
const app: Express = express()
// const port = process.env.PORT || 80
const port = 8085;

// CORSミドルウェアの追加
app.use(cors());
app.use(bodyParser.json());


// firebaseの初期化
// 1. サービスアカウント鍵を生成しserviceAccountKey.jsonでリネームしてfirebaseフォルダ直下に配置
const serviceAccount = require("./serviceAccountKey.json");

// firebaseの情報が入ったjsonファイルを取得する
const firebaseUrl = require("./firebaseUrl.json");
const databaseURL: string = firebaseUrl.firebaseUrl;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // 2. Realtime DatabaseのページでdatabaseURLを確認して反映
  databaseURL: databaseURL
});

const db = admin.database();

function registerEmail(uid: string, email: string){
  const ref = db.ref("emails");
  const usersRef = ref.child(uid);
  usersRef.set({
    "email": email
  });

  ref.on("value",
  function(snapshot) {
    console.log("受け取ったメールアドレスをデータベースにアップロードしました");
    console.log(snapshot.val());
  }, 
  function(errorObject) {
      console.log("failed: " + errorObject);
  });
}


// サーバーの処理
app.get('/', (req: Request, res: Response) => {
  res.send("Hello TypeScript")
})

// メールアドレス登録用のエンドポイントの設定
app.post("/register-email", async (req, res) => {
    // corsの許可を設定する
    res.header("Access-Control-Allow-Origin", "http://localhost:8090");
    res.header("Access-Control-Allow-Methods", "POST");
    // responseを処理する
    console.log("/register-email\nデータを受け取りました", req.body);
    res.send("gotten\n"+JSON.stringify(req.body));
    try{
      const uid: string = req.body.uid;
      const email: string = req.body.email;
      registerEmail(uid, email);
    }catch(e){
      console.log(e);
    }
});


// サーバーの起動
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})