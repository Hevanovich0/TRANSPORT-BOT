const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } = require('discord.js');
const express = require('express');
require('dotenv').config();

// Configuration
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
const app = express();
const PORT = process.env.PORT || 3000;

const salonTaxiId = '1341802481960882276';
const salonBusId = '1349639922574688266';
const roleAutoriseId = '1336435782302433432'; // Remplacer par l'ID du rôle autorisé
const GUILD_ID = '1336424856958271598'; // Remplacer par l'ID du serveur

let botAvatar = '';
let botReady = false;

// États de service
const enServiceTaxi = [];
const enServiceBusC1 = [];
const enServiceBusC2 = [];
const enServiceBusC3 = [];

// Serveur Express
app.get('/', (req, res) => {
  res.send('Le serveur est en ligne');
});
app.listen(PORT, () => {
  console.log(`🚀 Serveur de statut lancé sur le port ${PORT}`);
});

// Enregistrement des commandes
async function registerCommands(clientId) {
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
      options: [{
        name: 'utilisateur',
        type: 6,
        description: 'Utilisateur à retirer',
        required: true,
      }],
    },
  ];

  try {
    await rest.put(Routes.applicationGuildCommands(clientId, GUILD_ID), {
      body: commands,
    });
    console.log('✅ Commandes enregistrées (serveur de test).');
  } catch (error) {
    console.error('❌ Erreur d’enregistrement des commandes :', error);
  }
}

// Fonctions utilitaires
async function sendOrUpdateLastEmbed(channel, embed) {
  const messages = await channel.messages.fetch({ limit: 1 });
  const lastMessage = messages.first();

  if (lastMessage && lastMessage.author.id === client.user.id) {
    await lastMessage.edit({ embeds: [embed] });
  } else {
    await channel.send({ embeds: [embed] });
  }
}

async function updateTaxiMessage() {
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
    .setThumbnail(botAvatar);

  await sendOrUpdateLastEmbed(salon, embed);
}

// Gestion des interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  if (!interaction.inGuild() || ![salonTaxiId, salonBusId].includes(interaction.channelId)) {
    await interaction.reply({ content: '❌ Cette commande ne peut être utilisée que dans les salons dédiés.', ephemeral: true });
    return;
  }

  const { commandName, member } = interaction;
  const displayName = member.displayName;
  let message = '';

  try {
    switch (commandName) {
      case 'debut-taxi':
        if (!enServiceTaxi.includes(displayName)) enServiceTaxi.push(displayName);
        message = '🚕 Tu as commencé ton service de taxi.';
        await updateTaxiMessage();
        break;

      case 'fin-taxi':
        enServiceTaxi.splice(enServiceTaxi.indexOf(displayName), 1);
        message = '🛑 Tu as terminé ton service de taxi.';
        await updateTaxiMessage();
        break;

      case 'debut-c1':
        if (!enServiceBusC1.includes(displayName)) enServiceBusC1.push(displayName);
        message = '🚌 Tu as commencé ton service sur la ligne C1.';
        await updateBusMessage();
        break;

      case 'fin-c1':
        enServiceBusC1.splice(enServiceBusC1.indexOf(displayName), 1);
        message = '🛑 Tu as terminé ton service sur la ligne C1.';
        await updateBusMessage();
        break;

      case 'debut-c2':
        if (!enServiceBusC2.includes(displayName)) enServiceBusC2.push(displayName);
        message = '🚌 Tu as commencé ton service sur la ligne C2.';
        await updateBusMessage();
        break;

      case 'fin-c2':
        enServiceBusC2.splice(enServiceBusC2.indexOf(displayName), 1);
        message = '🛑 Tu as terminé ton service sur la ligne C2.';
        await updateBusMessage();
        break;

      case 'debut-c3':
        if (!enServiceBusC3.includes(displayName)) enServiceBusC3.push(displayName);
        message = '🚌 Tu as commencé ton service sur la ligne C3.';
        await updateBusMessage();
        break;

      case 'fin-c3':
        enServiceBusC3.splice(enServiceBusC3.indexOf(displayName), 1);
        message = '🛑 Tu as terminé ton service sur la ligne C3.';
        await updateBusMessage();
        break;

      case 'enlever':
        // Vérification du rôle spécifique pour utiliser cette commande
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
          const reply = await interaction.reply({ content: `✅ ${nomAffiche} a été retiré des services.`, ephemeral: true });

          // Faire disparaître le message après quelques secondes (3 secondes)
          setTimeout(() => {
            reply.delete().catch(console.error);
          }, 3000);
        } else {
          const reply = await interaction.reply({ content: `ℹ️ ${nomAffiche} n'était inscrit à aucun service.`, ephemeral: true });

          // Faire disparaître le message après quelques secondes (3 secondes)
          setTimeout(() => {
            reply.delete().catch(console.error);
          }, 3000);
        }
        return;

      default:
        message = '❓ Commande inconnue.';
    }

    const reply = await interaction.reply({ content: message, ephemeral: true, fetchReply: true });
    setTimeout(() => {
      interaction.deleteReply().catch(console.error);
    }, 3000);

  } catch (error) {
    console.error('❌ Erreur interactionCreate:', error);
    if (!interaction.replied) {
      await interaction.reply({ content: '❌ Une erreur est survenue.', ephemeral: true });
    }
  }
});

// Démarrage du bot
client.once('ready', async () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
  botAvatar = client.user.displayAvatarURL();
  await registerCommands(client.user.id);
  await updateTaxiMessage();
  await updateBusMessage();
  botReady = true;
});

client.login(process.env.TOKEN);
