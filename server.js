const express = require('express')
const fs = require('fs')
const cp = require('child_process')
const path = require('path')
const app = express()
app.use(express.json())
 app.post('/signup', (req,res) => {
   const {userName} = req.body
    const Dirpath = path.join(__dirname,`gitcat/${userName}`)
    if(!fs.existsSync(Dirpath)){
        fs.mkdir(Dirpath,(err) => {
            console.log(err);
        })
        res.json({mssg : "User created sucessfully !"})
    }
    else{
        console.log('user already exists please login')
        res.json({mssg : "User exists please login  !"})
    }
 })
 app.listen()