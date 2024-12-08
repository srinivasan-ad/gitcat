const express = require('express')
const fs = require('fs')
const cp = require('child_process')
const path = require('path')
const { error } = require('console')
const app = express()
app.use(express.json())
function createUser(userName){
const Dirpath = path.join(__dirname,`gitcat/${userName}`)
if(!fs.existsSync(Dirpath)){
    fs.mkdir(Dirpath,(err) => {
        console.log(err);
    })
}
else{
    console.log('user already exists please login')
}
}
function login(userName) {
    const Dirpath = path.join(__dirname,`gitcat/${userName}`)
    if(fs.existsSync(Dirpath)){
        fs.readdir(Dirpath,(err,files) => {
   if(err) throw err
   console.log('files in directory : ',files)
        })
    }
}
// createUser('Manoja')
login("Aditya")