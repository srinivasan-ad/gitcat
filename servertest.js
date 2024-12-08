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
function createRepo(userName,repoName){
    const Dirpath = path.join(__dirname , `gitcat/${userName}/${repoName}`)
    const bareDirpath = path.join(__dirname,`gitcat/${userName}/${repoName}/${repoName}.git`) 
    if(!fs.existsSync(Dirpath)){
        fs.mkdir(Dirpath,{ recursive: true },(err) => {
            console.log(err)
        })
        console.log(`repo ${repoName} created successfully`)
        const gitcmd = `git init --bare "${bareDirpath}"`
        cp.exec(gitcmd,(error,stdout) => {
           if(error) console.log(error)
            else{
        console.log(stdout)
            }
        }) 
        const dataDir = path.join(__dirname, `gitcat/${userName}/${repoName}/data`)
        fs.mkdir(dataDir,{ recursive: true },(err) => {
           if(err) console.log(err)
           else console.log("Data in repo created")       
        }) 
        const hooksDir = path.join(__dirname, `gitcat/${userName}/${repoName}/${repoName}.git/hooks`);
        fs.mkdir(hooksDir, { recursive: true }, (err) => {
          if (err) {
            console.error('Error creating hooks directory:', err);
            return;
          }

          const postReceiveFile = path.join(hooksDir, 'post-receive');
          const script = `
#!/bin/bash
# Paths
GIT_DIR="${bareDirpath}"
WORK_TREE="${dataDir}"

# Force checkout the latest changes into the working tree
git --work-tree=$WORK_TREE --git-dir=$GIT_DIR checkout -f main

# Optional: Log the update for debugging
echo "$(date): Synced working tree with main branch" >> /home/aditya-s/git-sync.log
`;

          fs.writeFile(postReceiveFile, script, (err) => {
            if (err) {
              console.error('Error writing post-receive script:', err);
            } else {
              fs.chmod(postReceiveFile, 0o755, (chmodErr) => {
                if (chmodErr) {
                  console.error('Error setting permissions on post-receive script:', chmodErr);
                } else {
                  console.log('post-receive script created and permissions set successfully');
                }
              });
            }
          });
    })
}}
// createUser('Manoja')
// login("Aditya")
// createRepo('Aditya','test-repo13')