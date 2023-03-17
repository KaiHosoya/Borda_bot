const {Client, Intents} = require('discord.js')
const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]})
const {scheduleJob} = require('node-schedule')

const borda_polls = {}

client.on('ready', ()=> {
    console.log(`Logged in as ${client.user.tag}!`)
    display_results()
})

client.on('messageCreate', async message=> {
    if (!message.content.startsWith('/')) return
  const args = message.content.slice(1).trim().split(/ +/g)
    const command=args.shift().toLowerCase()

    if (command === 'borda') {
      const poll_name=args.shift()
      const duration=parseFloat(args.shift()) || 24.0
      const options=args

      if (poll_name in borda_polls) {
          await message.channel.send(`この名前の投票がすでに存在しています: ${poll_name}`)
          return
      }

      borda_polls[poll_name]={
          "options": options,
          "channel": message.channel.id,
          "end_time": Date.now() + duration * 3600 * 1000
      }

      await message.channel.send(`投票 '${poll_name}' を作成しました。\nオプション: ${options.join(', ')}\n時間制限: ${duration} 時間`)
    }

    if (command === 'vote') {
      const poll_name=args.shift()
      const ranked_options=args

      if (!(poll_name in borda_polls)) {
          await message.channel.send(`この名前の投票は存在しません: ${poll_name}`)
          return
      }

      const poll_options=borda_polls[poll_name]["options"]
      if (!poll_options.every(option => ranked_options.includes(option)) || poll_options.length !== ranked_options.length) {
          await message.channel.send("投票のオプションが一致しません。")
          return
      }

      for (let i=0;
           i < ranked_options.length;
           i++) {
          borda_polls[poll_name][ranked_options[i]] += poll_options.length - i
      }

      await message.channel.send(`${message.author.username}さんの投票が受け付けられました。`)
    }
});

async function display_results() {
    for (const poll_name in borda_polls) {
        const poll_data = borda_polls[poll_name]

        if (Date.now() >= poll_data["end_time"]) {
            const results = Object.entries(poll_data)
            .filter(([key, _]) => poll_data["options"].includes(key))
            .map(([key, value])=> [key, value])
            .sort((a, b)=> b[1] - a[1])

            let response = `投票 '${poll_name}' の結果: \n`;
            for (const [option, votes] of results) {
                response += `${option}: ${votes} 点\n`;
            }
            
            const target_channel_id = poll_data["channel"];
            const target_channel = client.channels.cache.get(target_channel_id);
            await target_channel.send(response);
            
            delete borda_polls[poll_name];
            }
        }
            
    }

scheduleJob('*/1 * * * *', ()=> {
    display_results()
})

const TOKEN = "MTA4NTg3NTgxODM4MDY3NzE1MA.GDkYot.mm2QphnWqkJnpb0yepBb1l3m5qcjp1MGNo24xM"
client.login(TOKEN)
