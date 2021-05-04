const Discord = require("discord.js");
const { ipcRenderer } = require("electron");

const client = new Discord.Client();

window.addEventListener("DOMContentLoaded", () => {
	function notice(title, description) {
		const container = document.getElementById("notice");
		container.style.visibility = "visible";
		document.getElementsByTagName("main")[0].style.filter = "blur(1rem)";
		document.getElementsByTagName("main")[0].style.zIndex = "-1";

		const content = container.children[0];
		content.children.namedItem("title").innerHTML = title;
		content.children.namedItem("description").innerHTML = description;
	}

	function init() {
		const ui = document.createElement("div");
		ui.id = "Interface";
		const guilds = document.createElement("div");
		guilds.id = "Guilds";
		ui.append(guilds);
		const channels = document.createElement("div");
		channels.id = "Channels";
		ui.append(channels);
        const messanger = document.createElement("form");
		messanger.id = "Messanger";
        messanger.style.visibility = "hidden";
        const input = document.createElement("input");
        messanger.append(input);
		ui.append(messanger);
		const content = document.createElement("div");
		content.id = "Content";
		ui.append(content);
		document.getElementsByTagName("main")[0].append(ui);
	}

	ipcRenderer.on("asynchronous-message", (event, ...args) => {
		console.log(args);
	});

	const login = document.getElementById("login");
	login.addEventListener("submit", (event) => {
		event.preventDefault();
		const token = login.children.namedItem("token").value;
		login.hidden = true;
		client.login(token).catch((e) => {
			login.hidden = false;
			notice("Error", "Token invalid");
		});

		client.on("ready", () => {
			document.getElementById("welcome").innerHTML =
				"Welcome, " + client.user.tag + "!";
			notice("Success", "Logged in as " + client.user.tag);
			init();
            let currentChannel;

            client.on("message", (message) => {
                if(message.channel === currentChannel) {
                    content.prepend(createMessage(message))
                }
            })
            const messanger = document.getElementById("Messanger");
            const input = messanger.children[0];
            input.placeholder = "Send a message as " + client.user.tag;
            messanger.addEventListener("submit", (event) => {
                event.preventDefault();
                sendMessage(input.value);
                input.value = "";
            })

			const guilds = document.getElementById("Guilds");
			const channels = document.getElementById("Channels");
			const content = document.getElementById("Content");

			function loadChannels(guild) {
				content.innerHTML = "";
				channels.innerHTML = "";
				let iterator = 0;
				guild.channels.cache.forEach((channel) => {
					//if(!(["text","voice"].includes(channel.type))) return;
					const button = document.createElement("button");
					let type;
					//console.log(channel)
					switch (channel.type) {
						case "text":
							type = "🧻";
                            button.classList.add("TextChannel");
							button.onclick = () => {
								loadContent(channel);
							};
							break;
						case "voice":
							type = "🔈";
                            button.disabled = true;
                            button.classList.add("VoiceChannel");
							button.onclick = () => {
								// not working
								//joinChannel(channel)
							};
							break;
						case "news":
							type = "📰";
                            button.classList.add("NewsChannel");
							button.onclick = () => {
								loadContent(channel);
							};
							break;
						case "category":
							type = "CAT";
                            button.classList.add("Category");
                            return;
							//channels.append(document.createElement("br"))
							break;
						default:
							//console.log(channel)
							break;
					}
					button.innerHTML += `${type} ${channel.name}`;
					channels.append(button);
				});
			}

			function joinChannel(channel) {
				/*
                    Error [VOICE_NO_BROWSER]:
                    Voice connections are not available in browsers.
                */
				console.log("joining channel:", channel);
				navigator.getUserMedia(
					{
						audio: true,
					},
					(audioStream) => {
						console.log("got audiostream");
						console.log(channel);
						channel
							.join()
							.then((connection) => {
								console.log("got connection");
								connection.play(audioStream);
							})
							.catch((e) => {
								console.log(e);
							});
					},
					() => {}
				);
			}

			function fetchMessages(channel, b = null) {
                const options = {
					limit: 100,
					before: b ? b : null,
				};

				channel.messages.fetch(options).then((cache) => {
                    if(channel !== currentChannel) return;
					cache.forEach((message) => {
						content.append(createMessage(message));
					});
					if (!cache.last()) return;
					fetchMessages(channel, cache.last().id);
				});
			}

            function sendMessage(val) {
                currentChannel.send(val)
            }

			function loadContent(channel) {
				content.innerHTML = "";
                currentChannel = channel;
                messanger.style.visibility = "visible";
				fetchMessages(channel);
			}

			function createMessage(message) {
				const container = document.createElement("div");
				const header = document.createElement("div");
				const body = document.createElement("div");
                header.style.display = "flex"
				container.append(header);
				container.append(body);

				const pb = document.createElement("img");
				pb.style.height = "3rem";
				pb.style["border-radius"] = "2rem";
                pb.style.alignSelf = "flex-end"
				pb.src = message.author.avatarURL();

				const author = document.createElement("div");
				author.style.display = "flex";
				author.append(pb);
				const name = document.createElement("h1");
				name.innerHTML =
					message.author.username + "#" + message.author.discriminator;
				author.append(name);
				header.append(author);

				const date = document.createElement("h2");
                date.style.color = "var(--text-alt)"
                date.style.marginLeft = "0.5rem"
				const temp = new Date(message.createdTimestamp);
				date.innerHTML = `${temp.toLocaleTimeString()}|${temp.toLocaleDateString()}`;
				header.append(date);

				const content = document.createElement("p");
				content.innerHTML = message.content;
				for ([key, attachment] of message.attachments) {
					if (typeof attachment === "object") {
						const img = document.createElement("img");
						//console.log(attachment)
						img.src = attachment.attachment;
						img.style.width = "50vw";
						content.append(img);
					} else {
						//console.log(attachment)
					}
				}
				//console.log(message)
                body.style.marginLeft = "3.5rem"
                body.style.marginTop = "-2.2rem"
                body.class = "Message"
				body.append(content);

				return container;
			}

			client.guilds.cache.forEach((guild) => {
                guild.fetchWebhooks().then(a => {
                    console.log(a)
                })
				const button = document.createElement("button");
				if (guild.icon) {
					const img = document.createElement("img");
					img.src = guild.iconURL();
					button.append(img);
				} else {
                    const circle = document.createElement("div");
                    circle.style = `
                        border-radius: 2rem;
                        width: 3rem;
                        height: 3rem;
                        background-color: black;
                        display: flex;
                        flex-direction: column;
                        justify-content: center
                    `
                    const text = document.createElement("h1");
                    text.innerHTML = guild.name[0]
                    circle.append(text)
                    button.append(circle);
                }
				button.title = guild.name;
				button.onclick = () => {
					loadChannels(guild);
				};
				//button.innerText = guild.name;
				guilds.append(button);
			});
		});
	});

	ipcRenderer.send("asynchronous-message", "initialized");
});
