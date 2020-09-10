/**
 *  app.js
 *
 *  Discord bot template.
 */

/*******************
 * Library Imports *
 *******************/

require('dotenv').config();
const fs = require('fs');
const colors = require('chalk');
const Discord = require('discord.js');
const nodemailer = require('nodemailer');
const fetch = require('node-fetch');

/*********************
 * Global Properties *
 *********************/

// Config properties
const CONFIG = {
    // Bot token
    token: process.env.TOKEN,
    // Activity shown when the bot appears 'online'
    defaultActivity: {
        type: 'WATCHING', // Activity types: 'PLAYING', 'STREAMING', 'LISTENING', 'WATCHING'
        message: 'over east campus',
    },
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'APUDiscordBot@gmail.com',
        pass: process.env.EPASS,
    },
});

const roleIDs = {
    undergraduate: '751521035433672784', // Role: Undergraduate
    graduate: '744940838953680926', // Role: Graduate
    facultyStaff: '745699273425027072', // Role: Faculty/Staff
};

async function fetchProfile(userID) {
    let urlencoded = new URLSearchParams();
    urlencoded.append('user_id', userID);
    return fetch('https://home.apu.edu/apu/api/profile/newToken.php', {
        method: 'POST',
        body: urlencoded,
    })
        .then(res => res.json())
        .then(json => {
            const token = json.data.token;
            let urlencoded = new URLSearchParams();
            urlencoded.append('token', token);
            return fetch('https://home.apu.edu/apu/api/profile/profileAPIv2.php', {
                method: 'POST',
                body: urlencoded,
            })
                .then(res => res.json())
                .then(json => {
                    return json;
                });
        });
}

const testStudents = [
    'dattridge16',
    // 'dcordova',
    'cbunayog17',
    'kjnakamura',
    //'cgaonagalvan17',
    //'srouggly',
    //'reroberts'
    //'alexoh',
    // 'bbillar', in
    //'cratliff',
    //'mbrowning',
    //'rpierre',
    // 'rdavis', in
    //'alawson',
    // 'bgroom16', in
    //'rfang20',
    // 'cisozaki', in
    // 'cspilman18', in
    //'cchick18', in
    //'jaughtmon18', in
    //'amcox16',
    //'coyoung19',
    //'asetrakian19',
    // 'awood', in
    // 'aroberts', in
    // 'froberts' in
];

let tokens = {};

let Guild;

const suicideTriggers = [
    'I wish I was never born',
    'I want to die',
    'KMS',
    'Kill Myself',
    "I'm going to suffocate myself",
    "I'm going to commit suicide",
    'I just want to die',
    "I'm planning on commiting suicide",
    'I took an overdose',
    'I just want to die',
    'Time to die I guess',
    'Why am I alive',
    'Kill me',
    'End me',
    'I have trouble getting out of bed in the morning',
    'Killing myself',
    'I want to commit suicide',
    'I deserve to die',
    'Would anyone miss me?',
    'I really want to die',
    'I want to disappear',
    "Can't wait to die",
    "I don't want to be alive",
    'I hate being alive',
    'Why am I not dead',
    'Wish I was dead',
    "I'm going to jump off a building",
    'Hurt myself',
    'Hang myself',
    "I'm suicidal",
    "I don't want to live",
    'Shoot myself',
    'Cut myself',
    "I don't want to live anymore",
    'I kinda want to die',
    'I need help',
    'Where can I get help',
    'Hurting myself',
    'I actually want to kill myself',
];

/*************
 * Functions *
 *************/

/**
 *  Handle a command from a Discord user.
 *
 *  @param  {Object}    msg         The message object.
 *  @param  {String}    command     The `commandName` part of the message.
 *  @param  {Array}     args        The optional list of arguments from the message.
 *
 *  @note - Discord messages which are treated as commands are expected to look like: "!commandName arg1 arg2 arg3".
 */
async function handleCommand(msg, cmd, args) {
    const channel = msg.channel;
    const member = msg.member;

    switch (cmd.toLowerCase()) {
        case 'test':
            sendInvites(msg);
            break;
        case 'verify':
            // Verify the user based on the token received by email
            verifyUser(member, args[0], channel);
            break;
        case 'setname':
            // Set nickname for faculty and staff members
            handleSetName(member, args, channel);
            break;
        default:
            msg.reply(`I'm sorry, '!${cmd}' is not a command.`);
            break;
    }
}

// Generate a random 6 digit number
function generateToken({ min, max }) {
    const randNum = Math.floor(Math.random() * (max - min + 1) + min);
    return randNum.toString();
}

async function verifyUser(member, token, channel) {
    // For every user in the `tokens` object
    for (let netid of Object.keys(tokens)) {
        // Check if the user matches the token that was used in !verify command
        if (tokens[netid].token) {
            // Check if that token has been used
            if (tokens[netid].used) {
                member.send(
                    `The token '${token}' has already been used. 
                    Please use the support text channel to request a new token. 
                    We appoligize for the inconvenience.`
                );
                return;
            }

            member.send(`The token '${token}' was accepted!`);
            tokens[netid].used = true;
            saveObjectToFile(tokens, './tokens.json');

            // Fetches the users information from the home API
            // Assigns their nickname to be their name pulled from the home API
            // Assigns a users role based on their persona in the home API
            fetchProfile(netid).then(async profile => {
                const { personal, personas, academics } = profile;

                const { name } = personal
                const programs = academics.programs[0];

                let memberObj = await Guild.MemberManager.fetch(member.id);
                member.send(`Welcome! Your name on the server has been set to: ${name}`);
                await memberObj.setNickname(name);

                if (channel.type === 'dm') {
                    let newRoles = [];

                    // Check if user is staff member
                    if (personas.includes('STAFF')) {
                        newRoles.push(roleIDs.facultyStaff);
                        member.send(
                            'You have been assigned the Faculty/Staff role. Please use the !setName command followed by your first and last name. EX: !setName Freddie Cougar'
                        );
                    }

                    // Check if user has any student programs
                    Guild.RoleManager.fetch()
                        .then(roles => {
                            // Check for roles that match programs based on specific spelling
                            if (programs.includes('Career: Undergraduate'))
                                newRoles.push(roleIDs.undergraduate);
                            if (programs.includes('Career: Graduate'))
                                newRoles.push(roleIDs.graduate);
                                
                            // Check for any other roles that match the user's list of programs
                            for (let i in programs) {
                                for (let role of roles.cache) {
                                    const { name, id } = role[1];

                                    if (programs[i].includes(name)) {
                                        newRoles.push(id);
                                        console.log(`${netid} has a new role: ${name}`);
                                    }
                                }
                            }
                        })
                        .then(() => {
                            // Assign all of the roles pushed to the list above
                            for (let i in newRoles) {
                                console.log('Adding role: ' + newRoles[i]);
                                Guild.RoleManager.fetch(newRoles[i]).then(role => {
                                    //console.log(role);
                                    const { name, id } = role;
                                    console.log(`Trying to add role: ${name} with ID ${id}...`);
                                    memberObj.roles.add(role);
                                });
                            }
                        });
                }
            });

            // Exit this function so that we stop searching for a matching token in the `tokens` object
            return;
        }

        member.send(
            `The token: ${token} is invalid. 
            Please double check your email and try again. 
            If the issue persists and you belive this to be incorrect, 
            please put a message into the #support text channel and a moderator will help you shortly.`
        );
    }
}

async function handleSetName(member, args, channel) {
    const [first, last] = args,
        memberObj = await Guild.MemberManager.fetch(member.id),
        memberRoles = memberObj.roles.member._roles;
   
    if (channel.type === 'dm' && first && last) {
        const name = `${first} ${last}`;

        if (memberRoles.includes(roleIDs.facultyStaff)) {
            memberObj.setNickname(name);
            member.send(`Your nick name has been changed to ${name}`);
        }
    } else {
        member.send(`Please give a first and last name. Example: !setName Freddie Cougar`)
    }
}

//sends email invites to all students in the testStudents array
async function sendInvites(message) {
    fs.readFile('students.csv', 'utf8', (err, str) => {
        if (err) console.error(err);

        let lines = str.split(/\r?\n/).slice(1); // split by new line characters; remove first row

        // For each line in file
        for (let i in lines) {
            const [emplid, netid] = lines[i].split(',');
            if (emplid && netid) {
                // Check if user already has received a token
                if (tokens[netid] && tokens[netid].token) {
                    // This user already has received a token
                    console.log(`User ${netid} already got a token.`);
                } else {
                    sendEmailWithNewToken(message, netid);
                }
            }
        }
    });
}

async function sendEmailWithNewToken(message, netid) {
    const studentEmail = `${netid}@apu.edu`;

    const invite = await message.channel.createInvite({
        maxAge: 0,
        maxUses: 1,
        unique: true,
    });
    const inviteLink = 'https://discord.gg/' + invite.code;

    if (!tokens[netid] || !tokens[netid].token) {
        // User doesn't exist in `tokens` OR user does not have a token yet

        // Generate a new token
        const token = generateToken({ min: 100000, max: 999999 });

        // Save the token for later
        tokens[netid] = {
            used: false,
            token: token,
        };
        saveObjectToFile(tokens, './tokens.json');

        const body = `<p>By request of Brittany Billar, you have been selected to be test users to APU's New Community Discord.</p><br>
            <h1>Welcome back to APU!</h1>
            <p style="color:#000000">We have created a virtual place for students to be integrated to while in a remote learning environment!<br>
            Please use this link to join the Discord server.<br><br>
            <b>Your Invite Link:<br><br>
            ${inviteLink} </b><br><br>
            If the server doesn't pop up immediatly in your server bar on the left hand side, click the + button. Then click join server and copy and paste your invite link.<br>
            After you have joined, you will need to put in your access code so that we can verify that you belong to the APU community.<br><br>
            <b>Your Access Code: </b><br><br>
            <b style="color:#990000; font-size:2em">${token}</b><br><br>
            Please do not share this invite link or access code with anyone else. You may only use the code once, and no one else should use the link or code that belongs to you.<br><br>
            
            <i>Problems? Please respond back to this email and we will be sure to assist you</p>`;

        const mailOptions = {
            from: 'APUDiscordBot@gmail.com',
            to: studentEmail,
            subject: "Invite to Azusa Pacific University's Community Discord server!",
            html: body,
        };
        sendEmailWithOptions(mailOptions);
    }
}

/**
 *  Take a JavaScript object and save it to a JSON file.
 */
function saveObjectToFile(obj, file) {
    const json = JSON.stringify(obj);

    fs.writeFile(file, json, err => {
        if (err) {
            console.error('Error writing file', err);
            return;
        }

        console.log(`Successfully wrote to ${file}`);
    });
}

/**
 *  Print a Discord message to the console with colors for readability.
 *
 *  @param  {Object}     msg     The message object.
 */
function logMessageWithColors(msg) {
    const d = new Date(msg.createdTimestamp),
        h = d.getHours(),
        m = d.getMinutes(),
        s = d.getSeconds(),
        time = colors.grey(`[${h}:${m}:${s}]`),
        author = colors.cyan(`@${msg.author.username}`);

    console.log(`${time} ${author}: ${msg.content}`);
}

function sendEmailWithOptions(mailOptions) {
    transporter.sendMail(mailOptions, function (err) {
        if (err) {
            console.error(err);
            return;
        }
        console.log(`Email sent to: ${mailOptions.to}`);
    });
}

function watchForSuicideMessages(msg) {
    for (let i = 0; i < suicideTriggers.length; i++) {
        let t = suicideTriggers[i].toLowerCase();
        const variants = [
            t,
            t.replace(' ', ''),
            t.replace("i'm", 'im'),
            t.replace("i'm", 'i am'),
            t.replace('want to', 'wanna'),
            t.replace("can't", 'cant'),
            t.replace("can't", 'can not'),
            t.replace("don't", 'dont'),
            t.replace("don't", 'do not'),
        ];
        for (let j = 0; j < variants.length; j++) {
            if (msg.content.toLowerCase().includes(variants[j])) {
                msg.reply('Get help: 1-800-273-8255');

                // This will be used to email someone at APU of the student who said one of the trigger words to reach out to them
                var mailOptions = {
                    from: 'APUDiscordBot@gmail.com',
                    to: 'insert email here',
                    subject: 'Suicide watch alert',
                    html: `<p>This is a test to see if it will send an email if this functions right</p>`,
                };
                sendEmailWithOptions(mailOptions);
                break;
            }
        }
    }
}

/**************************
 * Discord Initialization *
 **************************/

const client = new Discord.Client();

// Handle bot connected to the server
client.on('ready', () => {
    console.log(colors.green(`Logged in as: ${client.user.tag}`));

    // Set the bot's activity
    client.user.setActivity(CONFIG.defaultActivity.message, {
        type: CONFIG.defaultActivity.type,
    });
});

// Handle message from user
client.on('message', msg => {
    // Print the message to console with timestamp and author
    logMessageWithColors(msg);

    /**
     *  Handle messages that are commands.
     *
     *  Commands are preceded by an exclamation mark.
     *  Commands may contain parameters delimited by spaces.
     *  Example: !commandName param1 param2.
     */

    const firstCharacter = msg.content[0];
    if (firstCharacter === '!') {
        let words = msg.content.split(' '),
            cmd = words.shift().split('!')[1], // First word, sans exclaimation mark
            args = words; // Everything after the first word as an array

        handleCommand(msg, cmd, args);
        return;
    }

    /**
     *  Handle messages that aren't commands.
     *
     *  Non-command messages are not preceded by an exclamation mark.
     */

    // Message is a `ping`
    if (msg.content === 'ping') {
        msg.reply('pong');
    }

    // Check if the message contains suicidal thoughts
    watchForSuicideMessages(msg);
});

// Welcome users to the server when they use their invite code
client.on('guildMemberAdd', member => {
    member.send('Welcome to the server!').then(() => {
        member.send(
            'Please use the command !verify alongside the 6-digit numerical token sent in your invitation email. Ex: "!verify 012345'
        );
    });
});

// Log the bot in using its bot token
client.login(CONFIG.token).then(() => {
    // Read the contents of tokens.json
    fs.readFile('./tokens.json', 'utf8', (err, json) => {
        if (err) {
            console.error(`Error reading file tokens.json: ${err}`);
            return;
        }

        // Verify that the file contains valid JSON
        try {
            // Replace global object `tokens` with parsed JSON from the file
            tokens = JSON.parse(json);
        } catch (err) {
            console.error(`Error parseing JSON from tokens.json: ${err}`);
        }
    });

    const { members, roles } = client.guilds.cache.get('743597793326661682');
    Guild = {
        MemberManager: members,
        RoleManager: roles,
    };
});
