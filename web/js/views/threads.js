import { $, escapeHtml, sectionHead, view } from "../dom.js";
import { postJson } from "../apiClient.js";
import { awardStamp, state } from "../state.js";

export async function renderThreads() {
  view.innerHTML = sectionHead("Local Threads", "Real cultural hosts matched from live place data and saved through a request ledger transaction.", "<button class='ghost' id='reloadHosts'>Reload</button>") +
    `<div id="hostList" class="grid"><div class="status" role="status">Loading local hosts.</div></div>`;
  $("reloadHosts").addEventListener("click", renderThreads);
  try {
    const data = await postJson("/api/threads/hosts", state.context);
    $("hostList").innerHTML = data.hosts.map(hostCard).join("") || `<div class="status">No local thread candidates found.</div>`;
    bindHostForms(data.hosts);
  } catch (error) {
    $("hostList").innerHTML = `<div class="status bad" role="alert">${escapeHtml(error.message)}</div>`;
  }
}

function hostCard(host) {
  return `
    <article class="card card-body">
      <p class="eyebrow">${escapeHtml(host.craft)}</p>
      <h2>${escapeHtml(host.name)}</h2>
      <p>${escapeHtml(host.area)}</p>
      <form data-host="${escapeHtml(host.id)}">
        <label>Name<input name="travelerName" required minlength="2" maxlength="80"></label>
        <label>Email<input name="email" type="email" required maxlength="120"></label>
        <label>Message<textarea name="message" required minlength="10" maxlength="600">Hi ${escapeHtml(host.name)}, I would like to learn more about your local cultural experience.</textarea></label>
        <button class="primary" type="submit">Request to connect</button>
      </form>
    </article>`;
}

function bindHostForms(hosts) {
  view.querySelectorAll("form[data-host]").forEach((hostForm) => {
    hostForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const host = hosts.find((item) => item.id === hostForm.dataset.host);
      const formData = new FormData(hostForm);
      try {
        const receipt = await postJson("/api/threads/request", {
          city: state.context.city,
          hostId: host.id,
          hostName: host.name,
          travelerName: formData.get("travelerName"),
          email: formData.get("email"),
          message: formData.get("message")
        });
        awardStamp(receipt.stamp);
        hostForm.insertAdjacentHTML("afterend", `<div class="status good" role="status">Request saved: ${escapeHtml(receipt.id)}</div>`);
        hostForm.reset();
      } catch (error) {
        hostForm.insertAdjacentHTML("afterend", `<div class="status bad" role="alert">${escapeHtml(error.message)}</div>`);
      }
    });
  });
}
