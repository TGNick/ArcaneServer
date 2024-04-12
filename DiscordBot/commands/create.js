const { MessageEmbed } = require("discord.js");
const functions = require("../../structs/functions.js");

module.exports = {
    commandInfo: {
        name: "create",
        description: "Creates an account on Lawin.",
        options: [
            {
                name: "email",
                description: "Your email.",
                required: true,
                type: 3 // string
            },
            {
                name: "username",
                description: "Your username.",
                required: true,
                type: 3
            },
            {
                name: "password",
                description: "Your password.",
                required: true,
                type: 3
            }
        ],
    },
    execute: async (interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const { options } = interaction;

        const discordId = interaction.user.id;
        const email = options.get("email").value;
        const username = options.get("username").value;
        const password = options.get("password").value;

        // Simulated registration function
        async function registerUser(discordId, username, email, password) {
            // Simulated registration logic
            // You can replace this with actual user registration logic
            // For now, it just prints the received data
            console.log(`Registering user: discordId=${discordId}, email=${email}, username=${username}, password=${password}`);
            // Simulated success response
            return { status: 200, message:'a user registered on arcaneserver' };
        }

        await registerUser(discordId, username, email, password)
            .then(resp => {
                let embed = new MessageEmbed()
                    .setColor(resp.status >= 400 ? "#ff0000" : "#56ff00")
                    .setAuthor(interaction.user.tag, interaction.user.avatarURL())
                    .addFields(
                        { name: 'Message', value: resp.message }
                    )
                    .setTimestamp();

                if (resp.status >= 400) return interaction.editReply({ embeds: [embed], ephemeral: true });

                (interaction.channel ? interaction.channel : interaction.user).send({ embeds: [embed] });
                interaction.editReply({ content: "You successfully created an account!", ephemeral: true });
            })
            .catch(error => {
                console.error("Error registering user:", error);
                let embed = new MessageEmbed()
                    .setColor("#ff0000")
                    .setAuthor(interaction.user.tag, interaction.user.avatarURL())
                    .addFields(
                        { name: 'Error', value: 'An error occurred while registering the user' }
                    )
                    .setTimestamp();

                interaction.editReply({ embeds: [embed], ephemeral: true });
            });
    }
}
