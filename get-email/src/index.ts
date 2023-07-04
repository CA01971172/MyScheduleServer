// expressモジュールのインポート
import express, { Express, Request, Response } from 'express'
import cors from 'cors';
import bodyParser from 'body-parser';
// firebaseモジュールのインポート
import admin from "firebase-admin";

// MyScheduleのアドレス
const frontEndAddress: string = "https://ca01971172.github.io";

// expressの初期化
const app: Express = express()
const port = process.env.PORT || 80

// CORSミドルウェアの追加
app.use(cors());
app.use(bodyParser.json());
// リバースプロキシ経由で Express サーバにアクセスしたときのクライアントのアドレスを取得可能にする
app.set('trust proxy', true);



// firebaseの初期化
// 1. サービスアカウント鍵を生成しserviceAccountKey.jsonでリネームしてfirebaseフォルダ直下に配置
const serviceAccount = require("./firebase/serviceAccountKey.json");

// firebaseの情報が入ったjsonファイルを取得する
const firebaseUrl = require("./firebase/firebaseUrl.json");
const databaseURL: string = firebaseUrl.firebaseUrl;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // 2. Realtime DatabaseのページでdatabaseURLを確認して反映
  databaseURL: databaseURL
});

const db = admin.database();

// emails下の操作を監視する
const emailRef = db.ref("emails");
const userRef = db.ref("users");
emailRef.on('value', (snapshot) => {
  const data = snapshot.val();
  // データの処理
  console.log(data);
});

// ユーザーのメールアドレスを登録する関数
function registerEmail(uid: string, email: string): void{
  if(uid && email){
    const userEmailRef = emailRef.child(uid);
    const authorizeRef = userRef.child(uid).child("isAuthorized");
    userEmailRef.set({
      email: email
    }, function(error) {
      if (error) {
        console.error("メールアドレスの登録に失敗しました", error);
      } else {
        
        authorizeRef.set(true);
        console.log("メールアドレスをデータベースに登録しました");
      }
    });
  }else{
    // データが存在しない場合、処理をしない
    console.log(`受け取ったデータが存在しません\nuid: ${uid}, email: ${email}`)
  }
}

// ユーザーのメールアドレスを削除する関数
function deleteEmail(uid: string): void{
  if(uid){
    const usersRef = emailRef.child(uid);
    usersRef.remove(function(error) {
      if (error) {
        console.error("メールアドレスの削除に失敗しました", error);
      } else {
        console.log("メールアドレスをデータベースから削除しました");
      }
    });
  }else{
    // データが存在しない場合、処理をしない
    console.log(`受け取ったデータが存在しません\nuid: ${uid}`)
  }
}


// サーバーの処理
app.get('/', (req: Request, res: Response) => {
  res.send("Hello MySchedule Server")
});

app.get('/hoge', (req: Request, res: Response) => {
  res.send("Hello MySchedule Server - hoge")
});

// メールアドレス登録用のエンドポイントの設定
app.post("/register-email", async (req, res) => {
  // corsの許可を設定する
  res.header("Access-Control-Allow-Origin", frontEndAddress);
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

// メールアドレス削除用のエンドポイントの設定
app.post("/delete-email", async (req, res) => {
  // corsの許可を設定する
  res.header("Access-Control-Allow-Origin", frontEndAddress);
  res.header("Access-Control-Allow-Methods", "POST");
  // responseを処理する
  console.log("/delete-email\nデータを受け取りました", req.body);
  res.send("gotten\n"+JSON.stringify(req.body));
  try{
    const uid: string = req.body.uid;
    deleteEmail(uid);
  }catch(e){
    console.log(e);
  }
});


// サーバーの起動
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})