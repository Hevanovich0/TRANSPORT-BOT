const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } = require('discord.js');
const express = require('express');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

const enServiceTaxi = [];
const enServiceBusC1 = [];
const enServiceBusC2 = [];
const enServiceBusC3 = [];

const salonTaxiId = '1341802481960882276';
const salonBusId = '1349639922574688266';
let botAvatar = '';
let botReady = false;

const app = express();

app.get('/', (req, res) => {
  res.send('Le serveur est en ligne');
});

const PORT = process.env.PORT || 3000;
console.log(`🚀 Serveur démarré sur le port ${PORT}`);
app.listen(PORT, () => {
  console.log(`🚀 Serveur de statut lancé sur le port ${PORT}`);
});

async function registerCommands() {
  const commands = [
    // Taxi
    {
      name: 'debut-taxi',
      description: 'Commence le service de taxi',
    },
    {
      name: 'fin-taxi',
      description: 'Termine le service de taxi',
    },

    // Bus
    {
      name: 'debut-c1',
      description: 'Commence le service du bus C1',
    },
    {
      name: 'fin-c1',
      description: 'Termine le service du bus C1',
    },
    {
      name: 'debut-c2',
      description: 'Commence le service du bus C2',
    },
    {
      name: 'fin-c2',
      description: 'Termine le service du bus C2',
    },
    {
      name: 'debut-c3',
      description: 'Commence le service du bus C3',
    },
    {
      name: 'fin-c3',
      description: 'Termine le service du bus C3',
    },
  ];

  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Commandes enregistrées.');
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement des commandes:', error);
  }
}

client.once('ready', async () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
  botAvatar = client.user.displayAvatarURL();

  await registerCommands();
  await updateTaxiMessage();
  await updateBusMessage();

  botReady = true;
});

async function updateTaxiMessage() {
  const salon = await client.channels.fetch(salonTaxiId);
  if (!salon) return console.log('❌ Salon des taxis introuvable.');

  const embed = new EmbedBuilder()
    .setColor(0xeca830)
    .setTitle('🚕 Taxis en service')
    .setDescription(enServiceTaxi.length ? enServiceTaxi.map(name => `- ${name}`).join('\n') : "Aucun taxi en service actuellement.")
    .setThumbnail(botAvatar)
    .setFooter({ text: `Mise à jour à ${new Date().toLocaleTimeString('fr-FR')}` });

  const messages = await salon.messages.fetch({ limit: 1 });
  if (messages.first() && messages.first().author.id === client.user.id) {
    await messages.first().edit({ embeds: [embed] });
  } else {
    await salon.send({ embeds: [embed] });
  }
}

async function updateBusMessage() {
  const salon = await client.channels.fetch(salonBusId);
  if (!salon) return console.log('❌ Salon des bus introuvable.');

  const embed = new EmbedBuilder()
    .setColor(0x508bab)
    .setTitle('🚌 Bus en service')
    .setDescription(
      `**Ligne C1 :**\n${enServiceBusC1.length ? enServiceBusC1.map(name => `- ${name}`).join("\n") : "Aucun en service"}\n\n` +
      `**Ligne C2 :**\n${enServiceBusC2.length ? enServiceBusC2.map(name => `- ${name}`).join("\n") : "Aucun en service"}\n\n` +
      `**Ligne C3 :**\n${enServiceBusC3.length ? enServiceBusC3.map(name => `- ${name}`).join("\n") : "Aucun en service"}`
    )
    .setThumbnail(botAvatar)
    .setFooter({ text: `Mise à jour à ${new Date().toLocaleTimeString('fr-FR')}` });

  const messages = await salon.messages.fetch({ limit: 1 });
  if (messages.first() && messages.first().author.id === client.user.id) {
    await messages.first().edit({ embeds: [embed] });
  } else {
    await salon.send({ embeds: [embed] });
  }
}

client.login(process.env.TOKEN);
