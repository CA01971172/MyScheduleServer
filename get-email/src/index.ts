import express, { Express, Request, Response } from 'express'
import cors from 'cors';
import bodyParser from 'body-parser';

const app: Express = express()
const port = process.env.PORT || 80

// CORSミドルウェアの追加
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req: Request, res: Response) => {
  res.send("Hello TypeScript")
})

// メールを送信するエンドポイントの設定
app.post("/get-email", async (req, res) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:8090"); // corsの許可
    console.log(req.body)
    res.send("gotten\n"+JSON.stringify(req.body))
/*     const { to, subject, text } = req.body;
    const msg = {
    to: to,
    from: {
        name: 'MySchedule',
        email: 'CA01971172@st.kawahara.ac.jp'
    },
    subject: subject,
    text: text
    };
    try {
        await sendgrid.send(msg);
        res.status(200).send('Email sent successfully');
    } catch (error) {
    console.error(error);
    res.status(500).send('Error sending email');
    } */
});

// サーバーの起動
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})