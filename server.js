const express = require('express')
const fs = require('fs')
const cp = require('child_process')
const path = require('path')
const stream = require('stream');

const app = express()
app.use(express.json())
const REPO_DIR = path.join(__dirname,`gitcat`)
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
                  res.json({mssg : "repo created successfully :)"})
                }
              });
            }
          });
    })
}
 })

app.get("/:username/:repo.git/info/refs", (req, res) => {
  try {
    const repo = req.params.repo;
    const gitCmd = req.query.service;
    console.log(req.method);
    console.log(req.query.service);
    const user_name = req.params.username;
    const repoLink = path.join(REPO_DIR, `${user_name}/${repo}/` + repo + ".git");
    console.log(repoLink);
    const gitProcess = cp.spawn(gitCmd, [
      repoLink,
      "--http-backend-info-refs",
      "--stateless-rpc",
      "--advertise-refs",
    ]);

    // req.pipe(gitProcess.stdin);
    req.on("data", (data) => {
      console.log("Data Req: ", data.toString());
    });
    res.on("data", (data) => {
      console.log("Data Res: ", data.toString());
    });
    gitProcess.stdout.on("data", (data) => {
      console.log("Data Process: ", data.toString());
    });
    // 001f# service=git-receive-pack
    const appendTransform = new stream.Transform({
      transform(chunk, encoding, callback) {
        const originalData = chunk.toString();
        let customText = "";
        if (gitCmd === "git-upload-pack") {
          customText = `001e# service=${gitCmd}\n0000`;
        } else if (gitCmd === "git-receive-pack") {
          customText = `001f# service=${gitCmd}\n0000`;
        } 
        this.push(customText + originalData);
        callback();
      },
    });
    res.setHeader("content-type", `application/x-${gitCmd}-advertisement`);
    req.pipe(gitProcess.stdin);
    res.status(200);
    gitProcess.stdout.pipe(appendTransform).pipe(res);
    gitProcess.stderr.pipe(process.stderr);

    gitProcess.on("error", (err) => {
      res.status(500).send("Git process error");
      console.log(`Git process error: ${err}`);
    });

    gitProcess.on("exit", (code) => {
      res.status(200).end();
      console.log(`\nGit process exited with code ${code}`);
    });
  } catch (error) {
    res.status(400).send("Error, please try again!");
    console.log("In error: ");
    console.log(error);
  }
});

// Handle the Git push operation (git-receive-pack)
app.post("/:username/:repo.git/git-receive-pack", (req, res) => {
  try {
    const repo = req.params.repo;
    const gitCmd = "git-receive-pack";
    console.log(req.method, req.body);
    console.log(req.query.service);
    const user_name = req.params.username;
    const repoLink = path.join(REPO_DIR, `${user_name}/${repo}/` + repo + ".git");
    console.log(repoLink);
    const gitProcess = cp.spawn(gitCmd, [repoLink, "--stateless-rpc"]);
    req.on("data", (data) => {
      console.log("Data Req: ", data.toString());
    });
    res.on("data", (data) => {
      console.log("Data Res: ", data.toString());
    });
    gitProcess.stdout.on("data", (data) => {
      console.log("Data Process: ", data.toString());
    });
    res.status(200);
    res.setHeader(
      "content-type",
      "application/x-git-receive-pack-advertisement"
    );
    req.pipe(gitProcess.stdin);
    gitProcess.stdout.pipe(res);
    gitProcess.stderr.pipe(process.stderr);

    gitProcess.on("error", (err) => {
      res.status(500).send("Git process error");
      console.log(`Git process error: ${err}`);
    });

    gitProcess.on("exit", (code) => {
      res.status(200).end();
      console.log(`\nGit process exited with code ${code}`);
    });
  } catch (error) {
    res.status(400).send("Error, please try again!");
    console.log("In error: ");
    console.log(error);
  }
});

// Handle the Git fetch operation (git-upload-pack)
app.post("/:username/:repo.git/git-upload-pack", (req, res) => {
  try {
    const repo = req.params.repo;
    const gitCmd = "git-upload-pack";
    console.log(req.method, req.body);
    console.log(req.query.service);
    const user_name = req.params.username;
    const repoLink = path.join(REPO_DIR, `${user_name}/${repo}/` + repo + ".git");
    console.log(repoLink);
    const gitProcess = cp.spawn(gitCmd, [repoLink, "--stateless-rpc"]);
    req.on("data", (data) => {
      console.log("Data Req: ", data.toString());
    });
    res.on("data", (data) => {
      console.log("Data Res: ", data.toString());
    });
    gitProcess.stdout.on("data", (data) => {
      console.log("Data Process: ", data.toString());
    });
    res.status(200);
    res.setHeader(
      "content-type",
      "application/x-git-upload-pack-advertisement"
    );
    req.pipe(gitProcess.stdin);
    gitProcess.stdout.pipe(res);
    gitProcess.stderr.pipe(process.stderr);

    gitProcess.on("error", (err) => {
      res.status(500).send("Git process error");
      console.log(`Git process error: ${err}`);
    });

    gitProcess.on("exit", (code) => {
      res.status(200).end();
      console.log(`\nGit process exited with code ${code}`);
    });
  } catch (error) {
    res.status(400).send("Error, please try again!");
    console.log("In error: ");
    console.log(error);
  }
});
 
 
 app.listen(5000,() => {
    console.log("Server started n port http://localhost:5000")
 })