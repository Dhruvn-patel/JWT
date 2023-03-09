const express = require('express');
const app = express();
const cookieParser = require('cookie-parser')
const path = require('path');
const bodyParser = require('body-parser');
const mysql2 = require('mysql2');
const { ejs } = require('ejs');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
dotenv.config({ path: "./.env" });
app.use(cookieParser())
const connection = mysql2.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
})
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'ejs');

const PORT = process.env.DATABASE_PORT;
async function queryExecuter(query) {
    return new Promise((resolve, rejects) => {
        connection.query(query, (err, result) => {
            if (err) {
                rejects(err);
            }
            resolve(result);
        });
    })
}

connection.connect((err) => {
    if (err) {
        console.log("Error connecting to database");
    }
    else {
        console.log("Connected to database");
    }
});


app.get('/register', (req, res) => {

    err=false;
    res.render('register',{ err  });
})

app.post('/register', async (req, res) => {

    const { name, email, password } = req.body;
   

    const hashPassword = await bcrypt.hashSync(password, 10);
    

    if (!(email && password && name)) {
      
    }

    let checkExists = await queryExecuter(`select email from jwt_token_tb `);
    console.log(checkExists);
    let flag = false;
    checkExists.forEach(element => {
        if (element.email === email) {
            flag = true;
        }
    });
    // console.log(flag);
    if (!flag) {
        const query = `insert into jwt_token_tb(name,email,password) values('${name}','${email}','${hashPassword}')`;
        const result = await queryExecuter(query);
        console.log(result);
    }
    else {
        let err = true;
        res.render('register', { err  });
    }


    res.redirect('/login');
});
app.get('/login', (req, res) => {
    res.render('login');
})

app.post('/login', async (req, res) => {
    try {

        const { email, password } = req.body;
        let query = `select * from jwt_token_tb where email='${email}'`;
        let result = await queryExecuter(query);
        // console.log(result );
        if (result.length > 0) {


            let db_pass=result[0].password;
            let userdata=result[0];
            bcrypt.compare(password, db_pass).then(function(result) {

                if(result)
                {
                    const token=jwt.sign({ userdata},process.env.SECRET_KEY);
                    // res.status(200).send({token});
                    res.cookie('token_value', token)
                    res.redirect('/home')
                }
                else
                {
                     let err=true;
                     res.render('login',{err})
                }

            });    

        }
        else
        {
            return res.status(401).send('Invalid credentials');
        }
    }
    catch (err) {
        throw err;
    }

})

app.get('/home',async(req,res) => {
    // res.render('home')
    const token = await req.cookies['token_value'];
    
    if(token)
    {
        const verified = jwt.verify(token, process.env.SECRET_KEY)
        console.log(verified);
        res.render('home', { user: verified.userdata });
    }
    else
    {
        res.redirect('/login')
    }

})



app.listen(PORT, (err) => {
    if (err) console.log(err);
    console.log(`http://localhost:${PORT}`);
})

