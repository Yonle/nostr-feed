const $ = document.querySelectorAll.bind(document);
let user_metas = {};

function tMediaURL(url, isAvatar) {
  const bwhero_addr = localStorage.getItem("bwhero_addr");
  const grayscale = localStorage.getItem("bwhero_grayscale") ? 1 : 0;
  const quality = localStorage.getItem("bwhero_quality") || 40;
  const avatar_quality = localStorage.getItem("bwhero_avatar_quality") || 8;
  if (!bwhero_addr) return url;

  return `${bwhero_addr}?bw=${grayscale || (query.get("grayscale") ? 1 : 0)}&l=${isAvatar ? avatar_quality : quality}&url=` + encodeURIComponent(url);
}

function makeMediaElement(line) {
  if (!line.startsWith("http")) return line;

  // Videos
  for (ex of ["mp4", "mov", "webm", "ogv"]) {
    if (line.endsWith("." + ex)) {
      return `<video controls src="${tMediaURL(line)}"></video>`;
    }
  }

  // Audios
  for (ex of ["mp3", "aac", "weba", "m4a", "flac", "wav", "ogg", "oga", "opus"]) {
    if (line.endsWith("." + ex)) {
      return `<audio controls src="${tMediaURL(line)}"></audio>`;
    }
  }

  // Images
  for (ex of ["jpg", "jpeg", "png", "apng", "webp", "avif", "gif"]) {
    if (line.endsWith("." + ex)) {
      return `<a href="${line}"><img src="${tMediaURL(line)}" /></a>`
    }
  }
}

function renderText(text) {
  return text
    .split("<br>").map(makeMediaElement).join("<br>")
    .split(" ").map(makeMediaElement).join(" ");
}

function makePostEl(data) {
  if (data.kind === 0) {
    user_metas[data.pubkey] = data;
    setProfile(data);
    return;
  }
  let div = document.createElement("div");
  let desc = document.createElement("span");
  let id = document.createElement("small");
  div.classList.add("post");

  // <div class="profile">
  let prof = document.createElement("div");
  let prof_info = document.createElement("div");
  let profile_avatar = document.createElement("img");
  let profile_display_name = document.createElement("span");
  let profile_nip_05 = document.createElement("small");

  profile_avatar.classList.add("user_avatar");
  profile_display_name.classList.add("user_display_name");
  profile_nip_05.classList.add("user_nip_05")

  profile_avatar.classList.add("user_" + data.pubkey + "_avatar");
  profile_display_name.classList.add("user_" + data.pubkey + "_display_name");
  profile_nip_05.classList.add("user_" + data.pubkey + "_nip_05");

  profile_display_name.innerText = "....";
  profile_nip_05.innerText = "....";

  prof_info.appendChild(profile_display_name);
  prof_info.innerHTML += "<br>";
  prof_info.appendChild(profile_nip_05);
  prof_info.classList.add("profile_info")

  prof.appendChild(profile_avatar);
  prof.appendChild(prof_info)

  prof.classList.add("profile");
  prof.classList.add("profile_" + data.pubkey);
  // </div>

  // <div class="postinfo">
  id.innerText = "Date: " + (new Date(data.created_at * 1000).toLocaleString()) + "\nEvent ID: " + data.id;

  desc.innerText = data.content
  desc.innerHTML = renderText(desc.innerHTML);

  div.appendChild(prof)
  div.innerHTML += "<br>";
  div.appendChild(desc);
  div.innerHTML += "<br>";
  div.appendChild(id);
  // </div>

  document.getElementById("posts").appendChild(div);

  // user metas
  if (!user_metas[data.pubkey]) {
    user_metas[data.pubkey] = {};
    getProfiles();
  }

  renderProfiles();
}

function setProfile(event) {
  if (event.kind !== 0) return;
  const pubkey = event.pubkey;
  const meta = JSON.parse(event.content);
  console.log("Rendering profile for", event.pubkey);

  // user_pubkey_avatar
  for (img of $(".user_" + pubkey + "_avatar")) {
    img.src = tMediaURL(meta.picture, true);
  }
  // user_pubkey_display_name
  for (h4 of $(".user_" + pubkey + "_display_name")) {
    h4.innerText = meta.display_name || meta.name;
  }
  // user_pubkey_nip_05
  for (small of $(".user_" + pubkey + "_nip_05")) {
    small.innerText = meta.nip05 || meta.name ? "@" + meta.name : meta.display_name;
  }
}

function renderProfiles() {
  console.log("Rendering profiles....");
  for (pk in user_metas) {
    setProfile(user_metas[pk]);
  }
}

function afterProfileRender() {
  // ....
}

function getProfiles() {
  if (!Object.keys(user_metas).length) return;
  const filter = {
    authors: Object.keys(user_metas),
    kinds: [0]
  }

  console.log("Fetching profiles....");
  ws.send(JSON.stringify(["REQ", "profiles_" + Math.floor(Date.now() / 1000), filter]));
}
