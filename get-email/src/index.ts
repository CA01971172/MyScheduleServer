import express, { Express, Request, Response } from 'express'

const app: Express = express()
const port = process.env.PORT || 80

app.get('/', (req: Request, res: Response) => {
  res.send("Hello TypeScript")
})

// メールを送信するエンドポイントの設定
app.post("/get-email", async (req, res) => {
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})