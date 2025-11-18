import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode-terminal"; // menšia a jednoduchšia knižnica pre log

const vulgarizmy = ["kokot", "pica", "jebat", "kurva", "debil"];

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        auth: state
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { qr, connection } = update;
        if (qr) {
            console.log("QR kód:");
            qrcode.generate(qr, { small: true }); // zobrazí QR kód v logu Render
        }
        if (connection === 'open') {
            console.log("Bot pripojený ✅");
        }
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || !msg.key.remoteJid) return;

        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            "";

        const from = msg.key.remoteJid;

        if (vulgarizmy.some(v => text.toLowerCase().includes(v))) {
            await sock.sendMessage(from, { text: "⚠️ Nevhodná správa bola nahlásená." });
        } else {
            await sock.sendMessage(from, { text: "Moderátor bot: " + text });
        }
    });
}

startBot();
