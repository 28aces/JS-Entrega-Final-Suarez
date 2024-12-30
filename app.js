// cSpell:ignore pokemon, pokemons, Pokemons

const API_URL = "https://pokeapi.co/api/v2/pokemon";
const MAX_POKEMON = 151;
let seenPokemons = JSON.parse(localStorage.getItem("seenPokemons")) || [];
let caughtPokemons = JSON.parse(localStorage.getItem("caughtPokemons")) || [];
let cachedPokemons;

const metricsSection = document.getElementById("metrics-section");
const cardsSection = document.getElementById("cards-section");
const searchInput = document.getElementById("search-input");
const sidebar = document.getElementById("sidebar");
const toastContainer = document.getElementById("toast-container");
const closeSidebarButton = document.getElementById("close-sidebar");
const sidebarTitle = document.getElementById("sidebar-title");
const sidebarList = document.getElementById("sidebar-list");
const sidebarTotal = document.getElementById("sidebar-total");
const clearAllButton = document.getElementById("clear-all");

async function fetchPokemons() {
  try {
    const responses = await Promise.all(
      Array.from({ length: MAX_POKEMON }, (_, i) => fetch(`${API_URL}/${i + 1}`))
    );
    const data = await Promise.all(responses.map(res => res.json()));

    cachedPokemons = data.map(pokemon => ({
      ...pokemon,
      isSeen: seenPokemons.includes(pokemon.name),
      isCaught: caughtPokemons.includes(pokemon.name)
    }));

    return cachedPokemons;
  } catch (error) {
    console.error("Error fetching Pokémon data:", error);
    showToast("Error fetching Pokémon data", "error");
  }
}

function renderMetrics() {
  metricsSection.innerHTML = `
        <div class="bg-white p-4 rounded shadow text-center relative">
            <div class="absolute top-2 right-2 flex gap-1">
              <button class="material-symbols-outlined px-2 py-1 rounded disabled:opacity-50" onclick="openSidebar('seen')">chevron_right</button>
          </div>
            <h3 class="text-xl font-bold">Pokémon Seen</h3>
            <p class="text-2xl">${seenPokemons.length}</p>
        </div>
        <div class="bg-white p-4 rounded shadow text-center relative">
          <div class="absolute top-2 right-2 flex gap-1">
              <button class=material-symbols-outlined px-2 py-1 rounded disabled:opacity-50" onclick="openSidebar('caught')">chevron_right</button>
          </div>
            <h3 class="text-xl font-bold">Pokémon Caught</h3>
            <p class="text-2xl">${caughtPokemons.length}</p>
        </div>
    `;
}

function renderCards(pokemons) {
  cardsSection.innerHTML = pokemons
    .map(pokemon => createCard(pokemon))
    .join("");
}

function createCard(pokemon) {
  const { id, name, types, sprites, isSeen, isCaught } = pokemon;

  return `
      <div class="bg-white p-4 rounded shadow relative">
          <div class="absolute top-2 right-2 flex gap-2">
              <button class="bg-gray-100 rounded-full material-symbols-outlined p-2" onclick="addToSeen('${name}')" ${isSeen ? "disabled" : ""}>visibility</button>
              <button class="bg-gray-100 rounded-full material-symbols-outlined p-2" onclick="addToCaught('${name}')" ${isCaught ? "disabled" : ""}>task_alt</button>
          </div>
          <h2 class="absolute top-1 left-4 text-5xl text-gray-200 font-normal mt-2">#${id}</h2>
          <img src="${sprites.front_default}" alt="${name}" class="w-full">
          <h4 class="text-xl font-bold">${capitalize(name)}</h4>
          <p class="text-sm text-gray-600">Type: ${capitalize(types.map(t => t.type.name).join(", "))}</p>
      </div>
  `;
}

document.addEventListener("DOMContentLoaded", async () => {
  cachedPokemons = await fetchPokemons();
  renderCards(cachedPokemons);
  renderMetrics();
  function searchPokemons(query) {
    const filteredPokemons = cachedPokemons.filter((pokemon) => {
      const { id, name, types } = pokemon;
      const idMatch = id.toString().includes(query);
      const nameMatch = name.toLowerCase().includes(query.toLowerCase());
      const typeMatch = types.some((type) =>
        type.type.name.toLowerCase().includes(query.toLowerCase())
      );
      return idMatch || nameMatch || typeMatch;
    });

    if (filteredPokemons.length > 0) {
      renderCards(filteredPokemons);
    } else {
      cardsSection.innerHTML = `
                    <h3 class="text-xl font-bold">No Pokémon found matching your search criteria.</h3>
                `;
    }
  }

  searchInput.addEventListener("input", (event) => {
    const query = event.target.value;
    searchPokemons(query);
  });

  searchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      const query = event.target.value;
      searchPokemons(query);
    }
  });

  closeSidebarButton.addEventListener("click", closeSidebar);

  clearAllButton.addEventListener("click", () => {
    const type = sidebarTitle.textContent.split(" ")[0].toLowerCase();
    clearAllFromType(type);
  });
});

function addToSeen(name) {
  if (!seenPokemons.includes(name)) {
    seenPokemons.push(name);
    localStorage.setItem("seenPokemons", JSON.stringify(seenPokemons));
    renderMetrics();
    showToast(`${name} added to Seen`, "success");

    cachedPokemons = cachedPokemons.map(pokemon => {
      if (pokemon.name === name) {
        return { ...pokemon, isSeen: true };
      }
      return pokemon;
    });

    renderCards(cachedPokemons);
  }
}

function addToCaught(name) {
  if (!caughtPokemons.includes(name)) {
    caughtPokemons.push(name);
    addToSeen(name);
    localStorage.setItem("caughtPokemons", JSON.stringify(caughtPokemons));
    renderMetrics();
    showToast(`${name} added to Caught`, "success");

    cachedPokemons = cachedPokemons.map(pokemon => {
      if (pokemon.name === name) {
        return { ...pokemon, isCaught: true, isSeen: true };
      }
      return pokemon;
    });

    renderCards(cachedPokemons);
  }
}

function openSidebar(type) {
    sidebarTitle.textContent = `${capitalize(type)} Pokémon`;
    updateSidebarContent(type);
    sidebar.classList.add("open");
    sidebar.classList.remove("translate-x-full");
}

function closeSidebar() {
    sidebar.classList.add("translate-x-full");
    sidebar.classList.remove("open");
    setTimeout(() => {
      sidebarList.innerHTML = "";
    }, 300);
}

function updateSidebarContent(type) {
  const list = type === "seen" ? seenPokemons : caughtPokemons;

  sidebarList.innerHTML = list
    .map(
      (name) => `
      <li class="p-2 border-b flex justify-between items-center">
          ${capitalize(name)}
          <button class="text-gray-400 material-symbols-outlined" onclick="deleteFromList('${name}', '${type}')">delete</button>
      </li>
  `
    )
    .join("");

  sidebarTotal.textContent = `Total: ${list.length} / ${MAX_POKEMON}`;
}

function deleteFromList(name, type) {
  const listKey = type === "seen" ? "seenPokemons" : "caughtPokemons";
  const listToRemoveFrom = type === "seen" ? seenPokemons : caughtPokemons;

  const index = listToRemoveFrom.indexOf(name);
  if (index > -1) {
    listToRemoveFrom.splice(index, 1);

    if (type === "seen") {
      const caughtIndex = caughtPokemons.indexOf(name);
      if (caughtIndex > -1) {
        caughtPokemons.splice(caughtIndex, 1);
        localStorage.setItem("caughtPokemons", JSON.stringify(caughtPokemons));
      }
    }

    localStorage.setItem(listKey, JSON.stringify(listToRemoveFrom));
    updateSidebarContent(type);
    renderMetrics();
    showToast(`${name} removed from ${capitalize(type)}`, "success");
  }

  cachedPokemons = cachedPokemons.map(pokemon => {
    return {
      ...pokemon,
      isSeen: seenPokemons.includes(pokemon.name),
      isCaught: caughtPokemons.includes(pokemon.name)
    };
  });

  renderCards(cachedPokemons);
}

function clearAllFromType(type) {
  if (type === "seen") {
    seenPokemons = [];
    localStorage.setItem("seenPokemons", JSON.stringify(seenPokemons));
    caughtPokemons = [];
    localStorage.setItem("caughtPokemons", JSON.stringify(caughtPokemons));
  } else if (type === "caught") {
    caughtPokemons = [];
    localStorage.setItem("caughtPokemons", JSON.stringify(caughtPokemons));
  }

  cachedPokemons = cachedPokemons.map(pokemon => {
    return {
      ...pokemon,
      isSeen: seenPokemons.includes(pokemon.name),
      isCaught: caughtPokemons.includes(pokemon.name)
    };
  });

  updateSidebarContent(type);
  renderMetrics();
  showToast(`${capitalize(type)} list cleared`, "success");

  renderCards(cachedPokemons);
}

function showToast(message, type) {
  const toast = document.createElement("div");
  toast.className = `p-3 rounded shadow mb-2 ${
    type === "success"
      ? "bg-green-500 text-white"
      : "bg-red-500 text-white"
  }`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}