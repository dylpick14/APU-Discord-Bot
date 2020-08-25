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

/*********************
 * Global Properties *
 *********************/
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
    token: "NzQ2MDM1NzM2NDgyMDIxNDg2.Xz6d7A.mDM8YNWcSB5tWWhPOIxR-u_RyLk",
    // Channel IDs
    channels: {
        general: "746072643148710012",
    },
    // Activity shown when the bot appears 'online'
    defaultActivity: {
        type: "PLAYING", // Activity types: 'PLAYING', 'STREAMING', 'LISTENING', 'WATCHING'
        message: "Animal Crossing",
    },
};

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
    const member = msg.author;
    switch (cmd) {
        case "test":
            channel.send("1...");
            channel.send("2...");
            channel.send("3!");
            break;
        case "netID":
            //goal is to get their name from the apu home API
            if (channel.type === "dm"){
                let netID = args[0];
                let roleID = '744939179619778721';
                if (netID.includes("15")){
                    roleID = roleIDs.fifthyear;
                }else if (netID.includes("16")){
                    roleID = roleIDs.seniors;
                } else if(netID.includes("17")){
                    roleID = roleIDs.juniors;
                } else if(netID.includes("18")){
                    roleID = roleIDs.sophomores;
                } else if(netID.includes("19")){
                    roleID = roleIDs.freshman;
                }  else {
                    roleID = roleIDs.facultyStaff;
                }
                let role = await Guild.RoleManager.fetch(roleID)
                let memberObj = await Guild.MemberManager.fetch(member.id)
                console.log(memberObj);
                memberObj.roles.add(role);

                member.send("Your name is now: " + args.join(" "))
            }
        default:
            msg.reply(
                `You used the command '!${cmd}' with these arguments: [${args.join(
                    ", "
                )}]`
            );
            break;
    }
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
        channel.send("Discord bot has joined the channel");
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
    member.send("Please use the command !netID followed by your apu netID. (Ex: !netID fcougar16)");
});
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
    Guild.MemberManager.fetch().then(async (members) => {
        let role = await Guild.RoleManager.fetch('744939179619778721')
        //console.log(role);
        //744939179619778721
        for (let member of members) {
            member = member[1];
            //console.log(member);
            if (member.user.username === 'cybu') {
                 member.roles.add(role);
            }
        }
    });
})