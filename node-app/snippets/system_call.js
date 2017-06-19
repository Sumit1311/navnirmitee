const exec = require('child_process').exec;
exec('ls ../public/img/toys/T1_*.jpg | wc -l', (error, stdout, stderr) => {
      if (error) {
              console.error(`exec error: ${error}`);
                  return;
                    }
        var count = parseInt(stdout);
        console.log(count);
        //console.log(`stderr: ${stderr}`);
});

