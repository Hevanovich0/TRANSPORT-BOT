const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } = require('discord.js');
const express = require('express');
require('dotenv').config();

// Initialisation du client Discord avec les intents nécessaires
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Nécessite d’être activé dans le portail Discord
  ],
});

// Initialisation du REST pour les commandes slash
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// Variables de services
const enServiceTaxi = [];
const enServiceBusC1 = [];
const enServiceBusC2 = [];
const enServiceBusC3 = [];

const salonTaxiId = '1341802481960882276';
const salonBusId = '1349639922574688266';
let botAvatar = '';
let botReady = false;

// Serveur Express
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Le serveur est en ligne');
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur de statut lancé sur le port ${PORT}`);
});

// Fonction pour enregistrer les commandes slash
async function registerCommands() {
  const commands = [
    { name: 'debut-taxi', description: 'Commence le service de taxi' },
    { name: 'fin-taxi', description: 'Termine le service de taxi' },
    { name: 'debut-c1', description: 'Commence le service du bus C1' },
    { name: 'fin-c1', description: 'Termine le service du bus C1' },
    { name: 'debut-c2', description: 'Commence le service du bus C2' },
    { name: 'fin-c2', description: 'Termine le service du bus C2' },
    { name: 'debut-c3', description: 'Commence le service du bus C3' },
    { name: 'fin-c3', description: 'Termine le service du bus C3' },
  ];

  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Commandes enregistrées.');
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement des commandes:', error);
  }
}

// Fonction utilitaire pour envoyer ou éditer le dernier embed
async function sendOrUpdateLastEmbed(channel, embed) {
  const messages = await channel.messages.fetch({ limit: 1 });
  const lastMessage = messages.first();

  if (lastMessage && lastMessage.author.id === client.user.id) {
    await lastMessage.edit({ embeds: [embed] });
  } else {
    await channel.send({ embeds: [embed] });
  }
}

// Mise à jour du message pour les taxis
async function updateTaxiMessage() {
  try {
    const salon = await client.channels.fetch(salonTaxiId);
    if (!salon) return console.log('❌ Salon des taxis introuvable.');

    const embed = new EmbedBuilder()
      .setColor(0xeca830)
      .setTitle('🚕 Taxis en service')
      .setDescription(
        enServiceTaxi.length
          ? enServiceTaxi.map(name => `- ${name}`).join('\n')
          : "Aucun taxi en service actuellement."
      )
      .setThumbnail(botAvatar)
      .setFooter({ text: `Mise à jour à ${new Date().toLocaleTimeString('fr-FR')}` });

    await sendOrUpdateLastEmbed(salon, embed);
  } catch (error) {
    console.error('❌ Erreur dans updateTaxiMessage:', error);
  }
}

// Mise à jour du message pour les bus
async function updateBusMessage() {
  try {
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

    await sendOrUpdateLastEmbed(salon, embed);
  } catch (error) {
    console.error('❌ Erreur dans updateBusMessage:', error);
  }
}

// Événement "ready" du bot
client.once('ready', async () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
  botAvatar = client.user.displayAvatarURL();

  // S'assurer que client.application est bien chargé
  await client.application.fetch();

  await registerCommands();
  await updateTaxiMessage();
  await updateBusMessage();

  botReady = true;
});

// Connexion du bot à Discord
client.login(process.env.TOKEN);
