app.all('/gitcat/:userName/:repoName.git/*', (req, res) => {
    const { userName, repoName } = req.params;
    const repoPath = path.join(__dirname, `gitcat/${userName}/${repoName}/${repoName}.git`);

    if (!fs.existsSync(repoPath)) {
        res.status(404).send('Repository not found');
        return;
    }

    const service = req.query.service; // "git-receive-pack" or "git-upload-pack"
    const env = {
        ...process.env,
        GIT_PROJECT_ROOT: path.dirname(repoPath),
        GIT_HTTP_EXPORT_ALL: '',
        GIT_DIR: repoPath,
    };

    // Handle "refs" request explicitly
    if (req.path.endsWith('/refs')) {
        const gitProcess = cp.spawn('git', ['for-each-ref'], { cwd: repoPath, env });

        gitProcess.stdout.pipe(res);
        gitProcess.stderr.pipe(process.stderr);

        gitProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`git for-each-ref failed with code: ${code}`);
            }
        });
        return;
    }

    if (req.path.endsWith('/info/refs') && service) {
        // Handle legacy "info/refs" requests
        const gitProcess = cp.spawn(service, ['--stateless-rpc', '--advertise-refs', repoPath], { env });

        res.setHeader('Content-Type', `application/x-${service}-advertisement`);
        res.write(`001e# service=${service}\n0000`);
        gitProcess.stdout.pipe(res);
        gitProcess.stderr.pipe(process.stderr);

        gitProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`${service} failed with code: ${code}`);
            }
        });
        return;
    }

    // Handle Git RPC requests (e.g., push/pull)
    const gitProcess = cp.spawn('git', ['receive-pack', repoPath], { env });

    req.pipe(gitProcess.stdin);
    gitProcess.stdout.pipe(res);
    gitProcess.stderr.pipe(process.stderr);

    gitProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`Git RPC operation failed with code: ${code}`);
        }
    });
});
