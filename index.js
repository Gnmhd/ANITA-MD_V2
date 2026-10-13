const http = require('http');
http.createServer((req,res)=>res.end('ANITA-MD-V2 ONLINE 👑')).listen(process.env.PORT || 3000);

const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')

const CONFIG = { ownerNumber: "22896352213", ownerName: "QUEEN ANITA", botName: "ANITA-MD-V2", prefix: ".", sessionFolder: "session" }

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(CONFIG.sessionFolder)
  const sock = makeWASocket({
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, P({level:'silent'})) },
    logger: P({level:'silent'}),
    browser: [CONFIG.botName,'Safari','1.0']
  })

  if (!sock.authState.creds.registered) {
    const phone = process.env.PHONE_NUMBER || "22896352213"
    console.log(`Numero: ${phone}`)
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(phone)
        console.log(`\n🔑 CODE D'APPARIAGE: ${code}\n`)
      } catch(e){ console.log("Erreur:", e.message) }
    }, 3000)
  }

  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', (u) => {
    if (u.connection === 'open') console.log(`✅ ${CONFIG.botName} CONNECTE!`)
    if (u.connection === 'close' && u.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) startBot()
  })

  sock.ev.on('messages.upsert', async ({messages}) => {
    const m = messages[0]; if (!m.message || m.key.fromMe) return
    const text = m.message.conversation || m.message.extendedTextMessage?.text || ""
    const from = m.key.remoteJid
    if (!text.startsWith(CONFIG.prefix)) return
    const cmd = text.slice(1).split(' ')[0].toLowerCase()
    if (cmd === 'menu') await sock.sendMessage(from, {text: `👑 *${CONFIG.botName}* 👑\n.menu - menu\n.ping - vitesse\n.owner - moi\n.alive - en vie`})
    if (cmd === 'ping') await sock.sendMessage(from, {text: `Pong! ⚡️ ${CONFIG.botName} en ligne`})
    if (cmd === 'owner') await sock.sendMessage(from, {text: `👑 ${CONFIG.ownerName}\nwa.me/${CONFIG.ownerNumber}`})
  })
}
startBot()
