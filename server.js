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

 app.post('/login',(req,res) => {
    const {userName} = req.body
    const Dirpath = path.join(__dirname,`gitcat/${userName}`)
    if(fs.existsSync(Dirpath)){
        fs.readdir(Dirpath,(err,files) => {
   if(err) throw err
   res.json({mssg : `files in directory : ${files}`})
        })
    }
    else{
        res.json({mssg : "User does not exist signup"})
    }
 })

 app.post('/create-repo',(req,res) => {
    const {userName,repoName} = req.body
    const Dirpath = path.join(__dirname , `gitcat/${userName}/${repoName}`)
    const bareDirpath = path.join(__dirname,`gitcat/${userName}/${repoName}/${repoName}.git`) 
    if(!fs.existsSync(Dirpath)){
        fs.mkdir(Dirpath,(err) => {
            console.log(err)
        })
        
    }
 })
 app.listen(5000,() => {
    console.log("Server started n port http://localhost:5000")
 })