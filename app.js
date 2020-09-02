/**
 *  app.js
 *
 *  Discord bot template.
 */

/*******************
 * Library Imports *
 *******************/
const colors = require("chalk");
const Discord = require("discord.js");
const nodemailer = require('nodemailer');
const { info } = require("console");
const fetch = require('node-fetch')
const dotenv = require('dotenv').config();


/*********************
 * Global Properties *
 *********************/
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'dattridge20@gmail.com',
        pass: process.env.EPASS
    }
});



const roleIDs = {
    seniors: '744939179619778721',
    juniors: '744939312596123788',
    sophomores:'744939352295211148',
    freshman:'744939409425825923',
    fifthyear:'744939006021599325',
    facultyStaff:'745699273425027072',
}
// Config properties
const CONFIG = {
    // Bot token
    token: process.env.TOKEN,
    // Channel IDs
    channels: {
        general: "746072643148710012",
    },
    // Activity shown when the bot appears 'online'
    defaultActivity: {
        type: "WATCHING", // Activity types: 'PLAYING', 'STREAMING', 'LISTENING', 'WATCHING'
        message: "over east campus",
    },
};


async function fetchProfile(userID) {
    
    fetch('https://home.apu.edu/apu/api/profile/newToken.php', {
         method: 'POST',
          body: `user_id=${userID}` 
    })
        .then((res) => res.json())
        .then((json) => {
            const token = json.data.token;
            fetch('https://home.apu.edu/apu/api/profile/profileAPIv2.php', {
                method: 'POST',
                body: `token=${token}` 
            })
            .then((res) => res.json())
            .then((json) => {
                console.log(json);
            })
        });
        
        
}
    



/*************
 * Functions *
 *************/
const testStudents = ["kjnakamura"];
const emailSuffix = "@apu.edu";
const emailedStudents = [];
const tokensGenerated = [];
const usedTokens = [];
const verify = false;
let inviteLinks = [];
const numStudents = testStudents.length;

async function sendInvites(message){
    for (let i = 0; i < numStudents; i++){
        const netID = testStudents[i];
        const studentEmail = netID + emailSuffix;
        var token = '';
        var max = 999999;
        var min = 100000;
    
        let invite = await message.channel.createInvite(
            {
                maxUses: 1,
                unique: true
            },
        )
        inviteCode = "https://discord.gg/" + invite.code;
        //console.log(inviteCode);
        inviteLinks.push({
            netID: netID,
            invite: inviteCode
        });
        
        token = generateToken(min, max);
        //console.log(token);
        tokensGenerated.push(token.toString());
        //console.log(studentEmail);
        const mailOptions = {
            from: 'dattridge20@gmail.com',
            to: studentEmail,
            subject: 'Invite to Azusa Pacific University\'s Community Discord server!',
            text: 'Welcome back! We have created a virtual place for students to be integrated to while in a remote learning environment! Please use this link to join the Discord server.\n' + inviteCode + '\nOnce joined you will need to put in your access token so that the server knows you are part of the APU community. Here is your token: ' + token
        };
        transporter.sendMail(mailOptions, function(error, info){
                if (error){
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
        emailedStudents.push(netID);
        //testStudents.splice(netID);
        
    }
    for (let i = 0; i < tokensGenerated.length; i++){
        console.log(tokensGenerated[i]);
    }
}
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
    const member = msg.author;
    switch (cmd) {
        case "test":
            sendInvites(msg);
            
            break;
        case "verify":
            //verifies
            let token = args[0];
            const index = tokensGenerated.indexOf(token);
            if (tokensGenerated.includes(token)){
                member.send("The token: " + args.join(" ") + " was accepted!");
                fetchProfile("").then((profile) => {
                    console.log(profile);
                });
                // member.send("Next please use the command !myinfo followed by your first name, last name, and your academic year (freshman, sophomore, junior, seniors, 5th year). Ex: !myinfo Freddie Cougar Sophomore. If you are faculty/staff please do !myinfo Freddie Cougar faculty/staff.");
                // verify = true;
                // usedTokens.push(token);  
                // tokensGenerated.splice(index, 1);
            } else if (usedTokens.includes(token)){
                member.send("The token: " + args.join(" ") + " has already been used. Please use the support text channel to request a new token. We appoligize for the inconvenience.");
            }else {
                member.send("The token: " + args.join(" ") + " is invalid. Please double check your email and try again. If the issue persists and you belive this to be incorrect, please put a message into the support text channel and a moderator will help you shortly.")
            }
            break;
        case "myinfo":
            let name = args[0] + " " + args[1];
            let year = args[2];
            year = year.toLowerCase();
            let roleID = '';
            if (channel.type === "dm"){
                if (year.includes("5th year")){
                    roleID = roleIDs.fifthyear;
                }else if (year.includes("senior")){
                    roleID = roleIDs.seniors;
                } else if(year.includes("junior")){
                    roleID = roleIDs.juniors;
                } else if(year.includes("sophomore")){
                    roleID = roleIDs.sophomores;
                } else if(year.includes("freshman")){
                    roleID = roleIDs.freshman;
                } else if(year.includes("faculty/staff")){
                    roleID = roleIDs.facultyStaff;
                } else{
                    member.send("Im sorry something was not correct, please try the !myinfo command again.")
                }
                let role = await Guild.RoleManager.fetch(roleID)
                let memberObj = await Guild.MemberManager.fetch(member.id)
                let nickname = await memberObj.setNickname(name);
                //console.log(memberObj);
                memberObj.roles.add(role);
                //memberObj.setNickname(firstName + " " + lastName);
                console.log(nickname);
                member.send("Your name on the server has been set to: " + name);
                member.send("You have been assigned the " + role + ". You now have access to the server! Enjoy!");
            }
            break;
        case "invite":
            
            break;
        default:
            msg.reply(
                `You used the command '!${cmd}' with these arguments: [${args.join(
                    ", "
                )}]`
            );
            break;
    }
}

function generateToken(min, max){
    return Math.floor(
        Math.random() * (max - min + 1) + min
    )
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

/**************************
 * Discord Initialization *
 **************************/

const client = new Discord.Client();

// Handle bot connected to the server
client.on("ready", () => {
    console.log(colors.green(`Logged in as: ${client.user.tag}`));

    // Set the bot's activity
    client.user
        .setActivity(CONFIG.defaultActivity.message, {
            type: CONFIG.defaultActivity.type,
        })
        .then();

    // Join the 'general' channel
    client.channels.fetch(CONFIG.channels.general).then((channel) => {
        //channel.send("Discord bot has joined the channel");
        console.log(
            colors.yellow(`Joined a channel: ${colors.yellow(channel.name)}`)
        );
    });
});

// Handle message from user
client.on("message", (msg) => {
    logMessageWithColors(msg);

    // Message is a command (preceded by an exclaimation mark)
    if (msg.content[0] === "!") {
        let words = msg.content.split(" "),
            cmd = words.shift().split("!")[1], // First word, sans exclaimation mark
            args = words; // Everything after first word as an array
        
        handleCommand(msg, cmd, args);
        return;
    }

    // Handle messages that aren't commands
    if (msg.content === "ping") {
        msg.reply("pong");
    }
});
client.on("guildMemberAdd", (member) => {
    member.send("Welcome to the server!");
    member.send("Please use the command !verify alongside the 6-digit numerical token sent in your invitation email. Ex: \"!verify 012345");
});


//function for google signin

// Login with the bot's token
let Guild;
client.login(CONFIG.token).then(async () => {
    const tempGuild = client.guilds.cache.get('743597793326661682');
    Guild = {
        MemberManager: tempGuild.members,
        RoleManager: tempGuild.roles
    };
        
    Guild.RoleManager.fetch().then(async (roles) => {
        for (let role of roles.cache) {
            role = role[1];
            //console.log(role);
            const { name, color, id } = role,
                hex = color.toString(16);
            //console.log(colors.hex(`#${hex}`)(name));
        }
    });
    
})