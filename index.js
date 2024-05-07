const Discord = require("discord.js");
const ytdl = require("ytdl-core");
require("dotenv").config();

const client = new Discord.Client();

const queue = new Map();

const prefix = process.env.PREFIX;
const token = process.env.TOKEN;

Discord.inte;

client.once("ready", () => {
  console.log("Ready!");
});

client.once("Reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnect");
});

client.on("message", async (message) => {
  //syntax for checking if message author is a bot return the message since the bot sent it
  if (message.author.bot) {
    console.log("Im the bot");
    return;
  }
  //check for ensuring the begging of the message starts with the prefix from the config.json
  if (!message.content.startsWith(prefix)) {
    console.log("Message Con", message);

    console.log("im a message without a prefix");
    return;
  }

  const serverQueue = queue.get(message.guild.id);

  switch (message.content) {
    case message.content.startsWith(`${prefix}play`):
      execute(message, serverQueue);
      return;

    case message.content.startsWith(`${prefix}skip`):
      skip(message, serverQueue);
      return;

    case message.content.startsWith(`${prefix}stop`):
      stop(message, serverQueue);
      return;

    default:
      message.channel.send("Invalid Command - not recognized");
  }
});

async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  console.log(args);
  const voiceChannel = message.member.voice.channel;

  if (!voiceChannel) {
    return message.channel.send(
      "You need to be in a voice channel to play music"
    );
  }

  const permissions = voiceChannel.permissionsFor(message.client.user);

  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "I need permissions to join and speak in your voice channel"
    );
  }

  const songInfo = await ytdl.getInfo(args[1]);

  const song = {
    title: songInfo.title,
    url: songInfo.video_url,
  };

  if (!serverQueue) {
    const queueConstruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true,
    };

    queue.set(message.guild.id, queueConstruct);

    queueConstruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueConstruct.connection = connection;

      play(message.guild, queueConstruct.songs[0]);
    } catch (error) {
      console.log(error);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    console.log(serverQueue.songs);
    return message.channel.send(`${song.title} has been added to the queue`);
  }
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);

  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", (error) => console.error(error));

  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Start Playing: ** ${song.title}`);
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel) {
    return message.channel.send(
      " You have to be in a voice channel to stop the music"
    );
  }

  if (!serverQueue) {
    return message.channel.send("THERE IS NO SONG THAT I COULD SKIP YOU FOOL");
  }

  serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel) {
    return message.channel.send(
      "You have to be in a voice channel to do that silly"
    );
  }

  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

client.login(token);
