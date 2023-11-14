const query = new URLSearchParams(location.hash.slice(1));
const relay = query.get("relay");

if (!relay) {
  $("#q")[0].style.display = "block";
} else {
  $("#t")[0].innerText = relay;
  $("#d")[0].style.display = "none";
}

const ws = new WebSocket(relay);

let filters = { kinds: [0, 1] }

ws.addEventListener("message", ({ data }) => {
  try {
    data = JSON.parse(data);
  } catch (e) {
    // That's it
    return false;
  }

  switch (data[0]) {
    case "NOTICE":
      console.log("NOTICE:", data[1]);
      break;
    case "EVENT":
      makePostEl(data[2]);
      break;
    case "EOSE":
      switch (data[1]) {
        case "posts":
          getProfiles();
          break;
        default:
          if (!data[1].startsWith("profiles_")) return;
          renderProfiles();
          afterProfileRender();
          ws.send(JSON.stringify(["CLOSE", data[1]]));
          break;
      }
      break;
  }
})

ws.addEventListener("open", _ => {
  ws.send(JSON.stringify(["REQ", "posts", filters]));
  setTimeout(getProfiles, 3000);

  document.title += " - " + relay;
});

ws.addEventListener("close", _ => {
  document.body.innerHTML += '<br><span style="color: red">Disconnected from relay. Refresh the page to reconnect.</span>';
  console.error("Disconnected from relay. Refresh the page to reconnect.");

  document.title = "Disconnected - " + document.title;
});
