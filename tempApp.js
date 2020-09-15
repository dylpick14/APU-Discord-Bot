const fs = require('fs');

var tokens = {
    cbunayog17: { used: false, token: '241156' },
    dattridge16: { used: false, token: '689054' },
};

function sendEmails() {
    // We get a list of all active students...
    fs.readFile('students.csv', 'utf8', (err, str) => {
        if (err) console.error(err);

        let lines = str.split(/\r?\n/).slice(1); // split by new line characters

        // For each line in file
        for (let i in lines) {
            const [emplid, netid] = lines[i].split(',');
            if (emplid && netid) {
                let hasReceivedToken = false;

                // Check if user already has received a token
                if (tokens[netid] && tokens[netid].token) {
                    // This user already has received a token
                    hasReceivedToken = true;
                    console.log(`User ${netid} already got a token.`);
                }

                if (!hasReceivedToken) {
                    // Generate token
                    
                    // Generate invite link

                    // Save the token to `tokens`

                    // Write `tokens` to tokens.json

                    // Send an email
                    console.log(`Sending new token and invite to: ${netid}@apu.edu`);
                }
            }
        }
    });
}