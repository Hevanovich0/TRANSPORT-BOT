const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } = require('discord.js');
const express = require('express');
require('dotenv').config();

// Initialisation du client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// REST pour enregistrer les commandes
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// Services en cours
const enServiceTaxi = [];
const enServiceBusC1 = [];
const enServiceBusC2 = [];
const enServiceBusC3 = [];

const salonTaxiId = '1341802481960882276';
const salonBusId = '1349639922574688266';
const roleAutoriseId = '1336435782302433432'; // ⬅️ ID du rôle autorisé à utiliser /enlever

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

// Commandes slash à enregistrer
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
    {
      name: 'enlever',
      description: 'Retire un utilisateur de toutes les listes de service',
      options: [
        {
          name: 'utilisateur',
          type: 6,
          description: 'Utilisateur à retirer',
          required: true,
        },
      ],
    },
  ];

  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Commandes enregistrées.');
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement des commandes:', error);
  }
}

// Envoie ou met à jour un embed
async function sendOrUpdateLastEmbed(channel, embed) {
  const messages = await channel.messages.fetch({ limit: 1 });
  const lastMessage = messages.first();

  if (lastMessage && lastMessage.author.id === client.user.id) {
    await lastMessage.edit({ embeds: [embed] });
  } else {
    await channel.send({ embeds: [embed] });
  }
}

// Mise à jour des taxis
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
      .setThumbnail(botAvatar);

    await sendOrUpdateLastEmbed(salon, embed);
  } catch (error) {
    console.error('❌ Erreur updateTaxiMessage:', error);
  }
}

// Mise à jour des bus
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
      .setThumbnail(botAvatar);

    await sendOrUpdateLastEmbed(salon, embed);
  } catch (error) {
    console.error('❌ Erreur updateBusMessage:', error);
  }
}

// Répond aux interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  if (!interaction.inGuild() ||
    (interaction.channelId !== salonTaxiId && interaction.channelId !== salonBusId)) {
    await interaction.reply({ content: '❌ Cette commande ne peut être utilisée que dans les salons dédiés.', ephemeral: true });
    return;
  }

  const { commandName, user, member } = interaction;
  const displayName = member.displayName;

  try {
    let message = '';

    switch (commandName) {
      case 'debut-taxi':
        if (!enServiceTaxi.includes(displayName)) enServiceTaxi.push(displayName);
        message = `🚕 Tu as commencé ton service de taxi.`;
        await updateTaxiMessage();
        break;

      case 'fin-taxi':
        enServiceTaxi.splice(enServiceTaxi.indexOf(displayName), 1);
        message = `🛑 Tu as terminé ton service de taxi.`;
        await updateTaxiMessage();
        break;

      case 'debut-c1':
        if (!enServiceBusC1.includes(displayName)) enServiceBusC1.push(displayName);
        message = `🚌 Tu as commencé ton service sur la ligne C1.`;
        await updateBusMessage();
        break;

      case 'fin-c1':
        enServiceBusC1.splice(enServiceBusC1.indexOf(displayName), 1);
        message = `🛑 Tu as terminé ton service sur la ligne C1.`;
        await updateBusMessage();
        break;

      case 'debut-c2':
        if (!enServiceBusC2.includes(displayName)) enServiceBusC2.push(displayName);
        message = `🚌 Tu as commencé ton service sur la ligne C2.`;
        await updateBusMessage();
        break;

      case 'fin-c2':
        enServiceBusC2.splice(enServiceBusC2.indexOf(displayName), 1);
        message = `🛑 Tu as terminé ton service sur la ligne C2.`;
        await updateBusMessage();
        break;

      case 'debut-c3':
        if (!enServiceBusC3.includes(displayName)) enServiceBusC3.push(displayName);
        message = `🚌 Tu as commencé ton service sur la ligne C3.`;
        await updateBusMessage();
        break;

      case 'fin-c3':
        enServiceBusC3.splice(enServiceBusC3.indexOf(displayName), 1);
        message = `🛑 Tu as terminé ton service sur la ligne C3.`;
        await updateBusMessage();
        break;

      case 'enlever':
        if (!member.roles.cache.has(roleAutoriseId)) {
          await interaction.reply({ content: '❌ Tu n’as pas la permission d’utiliser cette commande.', ephemeral: true });
          return;
        }

        const userARetirer = interaction.options.getUser('utilisateur');
        const memberARetirer = await interaction.guild.members.fetch(userARetirer.id);
        const nomAffiche = memberARetirer.displayName;

        let modif = false;

        if (enServiceTaxi.includes(nomAffiche)) {
          enServiceTaxi.splice(enServiceTaxi.indexOf(nomAffiche), 1);
          await updateTaxiMessage();
          modif = true;
        }

        if (enServiceBusC1.includes(nomAffiche)) {
          enServiceBusC1.splice(enServiceBusC1.indexOf(nomAffiche), 1);
          modif = true;
        }

        if (enServiceBusC2.includes(nomAffiche)) {
          enServiceBusC2.splice(enServiceBusC2.indexOf(nomAffiche), 1);
          modif = true;
        }

        if (enServiceBusC3.includes(nomAffiche)) {
          enServiceBusC3.splice(enServiceBusC3.indexOf(nomAffiche), 1);
          modif = true;
        }

        if (modif) {
          await updateBusMessage();
          await interaction.reply({ content: `✅ ${nomAffiche} a été retiré des services.`, ephemeral: true });
        } else {
          await interaction.reply({ content: `ℹ️ ${nomAffiche} n'était inscrit à aucun service.`, ephemeral: true });
        }
        break;

      default:
        message = '❓ Commande inconnue.';
    }

    if (commandName !== 'enlever') {
      const reply = await interaction.reply({ content: message, ephemeral: true, fetchReply: true });
      setTimeout(() => {
        interaction.deleteReply().catch(console.error);
      }, 3000);
    }
  } catch (error) {
    console.error('❌ Erreur interactionCreate:', error);
    if (!interaction.replied) {
      await interaction.reply({ content: '❌ Une erreur est survenue.', ephemeral: true });
    }
  }
});

// Quand le bot est prêt
client.once('ready', async () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
  botAvatar = client.user.displayAvatarURL();
  await client.application.fetch();
  await registerCommands();
  await updateTaxiMessage();
  await updateBusMessage();
  botReady = true;
});

// Connexion
client.login(process.env.TOKEN);
