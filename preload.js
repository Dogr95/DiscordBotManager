const Discord = require('discord.js');
const { ipcRenderer } = require('electron');

const client = new Discord.Client();

window.addEventListener('DOMContentLoaded', () => {

    function notice(title, description) {
        const container = document.getElementById("notice");
        container.style.visibility = "visible"

        const content = container.children[0];
        content.children.namedItem("title").innerHTML = title
        content.children.namedItem("description").innerHTML = description
    }

    function init() {
        const ui = document.createElement("div");
        ui.id = "Interface"
        const guilds = document.createElement("div")
        guilds.id = "Guilds"
        ui.append(guilds)
        const channels = document.createElement("div");
        channels.id = "Channels"
        ui.append(channels)
        const content = document.createElement("content");
        content.id = "Content"
        ui.append(content)
        document.body.append(ui);
    }

    ipcRenderer.on('asynchronous-message', (event, ...args) => {
        console.log(args)
    })

    const login = document.getElementById("login");
    login.addEventListener("submit", (event) => {
        event.preventDefault();
        const token = login.children.namedItem("token").value;
        login.hidden = true;
        client.login(token).catch(e => {
            login.hidden = false;
            notice("Error", "Token invalid")
        });

        client.on("ready", () => {
            notice("Success", "Logged in as "+client.user.tag);
            init();
            const guilds = document.getElementById("Guilds")
            const channels = document.getElementById("Channels")
            const content = document.getElementById("Content")

            function loadChannels(guild) {
                content.innerHTML = ""
                channels.innerHTML = ""
                let iterator = 0;
                guild.channels.cache.forEach(channel => {
                    //if(!(["text","voice"].includes(channel.type))) return;
                    const button = document.createElement("button");
                    let type;
                    //console.log(channel)
                    switch(channel.type) {
                        case "text":
                            type = "🧻"
                            button.onclick = () => {
                                loadContent(channel)
                            }
                            break;
                        case "voice":
                            type = "🔈"
                            button.onclick = () => {
                                // not working
                                //joinChannel(channel)
                            }
                            break;
                        case "news":
                            type = "📰"
                            button.onclick = () => {
                                loadContent(channel)
                            }
                            break;
                        case "category":
                            type = "CAT"
                            channels.append(document.createElement("br"))
                            break;
                        default:
                            //console.log(channel)
                            break;
                    }
                    button.innerHTML += `${type} ${channel.name}`
                    channels.append(button)
                })
            }

            function joinChannel(channel) {
                /*
                    Error [VOICE_NO_BROWSER]:
                    Voice connections are not available in browsers.
                */
                console.log("joining channel:", channel)
                navigator.getUserMedia(
                    {
                        audio: true
                    }, (audioStream) => {
                        console.log("got audiostream")
                        console.log(channel)
                        channel.join().then(connection => {
                            console.log("got connection")
                            connection.play(audioStream)
                        }).catch(e => {console.log(e)})
                 }, () => {})
            }

            function fetchMessages(channel, b=null) {
                const options = {
                    limit: 100,
                    before: b ? b : null
                }

                channel.messages.fetch(options).then(
                    cache => {
                        cache.forEach(message => {
                            content.append(createMessage(message))
                        })
                        if(!cache.last()) return;
                        fetchMessages(channel, cache.last().id)
                })
            }

            function loadContent(channel) {
                content.innerHTML = ""
                fetchMessages(channel)
            }

            function createMessage(message) {
                const container = document.createElement("div");
                const header = document.createElement("div");
                const body = document.createElement("div");
                container.append(header);
                container.append(body);

                const author = document.createElement("h1");
                author.innerHTML = message.author.username + "#" + message.author.discriminator
                header.append(author)

                const date = document.createElement("h2");
                const temp = new Date(message.createdTimestamp)
                date.innerHTML = `${temp.toLocaleTimeString()}|${temp.toLocaleDateString()}`;
                header.append(date)

                const content = document.createElement("p");
                content.innerHTML = message.content;
                for([key, attachment] of message.attachments) {
                    if(typeof attachment === "object") {
                        const img = document.createElement("img");
                        //console.log(attachment)
                        img.src = attachment.attachment;
                        img.style.width = "50vw";
                        content.append(img)
                    } else {
                        //console.log(attachment)
                    }
                }
                //console.log(message)
                body.append(content)

                return container;
            }

            client.guilds.cache.forEach(guild => {
                const button = document.createElement("button");
                button.onclick = () => {
                    loadChannels(guild)
                }
                button.innerHTML = guild.name;
                guilds.append(button)
            });
        })
        
    })

    ipcRenderer.send("asynchronous-message", "initialized")
})