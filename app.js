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
    student:'744939006021599325',
    facultyStaff:'745699273425027072',
    accounting: '744940822914400358',
    alliedHealth: '744940824940511254',
    animationVisualEffects: '744940826169311393',
    appliedMath: '744940827200979014',
    art: '744940827599700049',
    biblicalStudies: '744940827910078606',
    biochemistry: '744940828744613969',
    Biology: '744940828744613969',
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
    let urlencoded = new URLSearchParams();
    urlencoded.append("user_id", userID);
    return fetch('https://home.apu.edu/apu/api/profile/newToken.php', {
         method: 'POST',
          body: urlencoded 
    })
        .then((res) => res.json())
        .then((json) => {
            const token = json.data.token;
            let urlencoded = new URLSearchParams();
            urlencoded.append("token", token);
            return fetch('https://home.apu.edu/apu/api/profile/profileAPIv2.php', {
                method: 'POST',
                body: urlencoded 
            })
            .then((res) => res.json())
            .then((json) => {
                return json;
            })
        });
        
        
}




/*************
 * Functions *
 *************/
const testStudents = ["kjnakamura", "dattridge16"];
const emailSuffix = "@apu.edu";
const emailedStudents = [];
let tokens = {}
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
        inviteLinks.push({
            netID: netID,
            invite: inviteCode
        });
        
        token = generateToken(min, max).toString();
        tokens[token] = {
            used:false,
            netid: netID
        }
        const mailOptions = {
            from: 'dattridge20@gmail.com',
            to: studentEmail,
            subject: 'Invite to Azusa Pacific University\'s Community Discord server!',
            html: `<h1>Welcome back to APU!</h1>
            <p style="color:#000000">We have created a virtual place for students to be integrated to while in a remote learning environment!<br>
            Please use this link to join the Discord server.<br><br>
            <b>Your Invite Link:<br><br>
            ${inviteCode} </b><br><br>
            After you have joined, you will need to put in your access token so that we can verify that you belong to the APU community.<br><br>
            <b>Your Access Code: </b><br><br>
            <b style="color:#990000; font-size:2em">${token}</b><br><br>
            Please do not share this invite link or access code with anyone else. You may only use the code once, and no one else should use the link or code that belongs to you.<br><br>
            
            <i>Problems? Please contact the Support Desk to get a new invite link: <a href= "mailto:support@apu.edu">support@apu.edu</a></i></p>`
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
            if (tokens[token]){
                if (tokens[token].used){
                    member.send("The token: " + token + " has already been used. Please use the support text channel to request a new token. We appoligize for the inconvenience.");
                } else{
                    member.send("The token: " + token + " was accepted!");
                    tokens[token].used = true;
                    fetchProfile(tokens[token].netid).then(async (profile) => {
                        var name = profile.personal.name;
                        var persona = profile.personas;
                        let programs = profile.academics.programs[0];
                        let memberObj = await Guild.MemberManager.fetch(member.id)
                        let nickname = await memberObj.setNickname(name);
                        member.send("Welcome Your name on the server has been set to: " + name);
                        if (channel.type === "dm"){
                            console.log(persona);
                            if (persona.includes("STU") || persona.includes("GP")){
                                roleID = roleIDs.student;
                                member.send("You have been assigned the Student role. You now have access to the server! Enjoy!");
                            }else{
                                roleID = roleIDs.facultyStaff;
                                member.send("You have been assigned the Faculty/Staff role. Please use the !setName command followed by your first and last name. EX: !setName Freddie Cougar");
                            } 
                            let role = await Guild.RoleManager.fetch(roleID)
                            memberObj.roles.add(role);

                            Guild.RoleManager.fetch().then(async (roles) => {
                                for (let role of roles.cache) {
                                    role = role[1]
                                    const { name, id } = role;
                                    // if(programs.includes(name)){
                                    //     memberObj.roles.add(id);
                                    // }
                                    for (let program in programs){
                                        if (program.includes(name)){
                                            memberObj.roles.add(id);
                                        }
                                    }
                                        
                                }
                            })
                            //let role = Guild.RolesManager.find(r => r.name === "Major: Computer Science");
                            //console.log(role);
                        }

                    });
                }
            }else {
                member.send("The token: " + token + " is invalid. Please double check your email and try again. If the issue persists and you belive this to be incorrect, please put a message into the support text channel and a moderator will help you shortly.")
            }
            break;
        
        case "setName":
            var name = args[0] + " " + args[1];
            var roleID = roleIDs.facultyStaff;
            let memberObj = await Guild.MemberManager.fetch(member.id)
            let memberRoles = memberObj.roles.member._roles
            if (memberRoles.includes(roleID)){
                await memberObj.setNickname(name);
            }
            
            
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