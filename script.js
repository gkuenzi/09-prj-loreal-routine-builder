/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

// Array to store selected products
let selectedProducts = [];

// Load selected products from localStorage (if any)
function loadSelectedProducts() {
  const saved = localStorage.getItem("selectedProducts");
  if (saved) {
    try {
      selectedProducts = JSON.parse(saved);
    } catch {
      selectedProducts = [];
    }
  }
}

// Save selected products to localStorage
function saveSelectedProducts() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

/* Create HTML for displaying product cards */
// Function to display selected products in the box
function displaySelectedProducts() {
  const selectedProductsList = document.getElementById("selectedProductsList");
  // Clear previous content
  selectedProductsList.innerHTML = "";

  // Loop through selected products and create cards
  selectedProducts.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
      <button class="remove-btn">Remove</button>
    `;
    // Add event to remove button
    card.querySelector(".remove-btn").addEventListener("click", function () {
      // Remove product from selectedProducts array
      const index = selectedProducts.findIndex((p) => p.name === product.name);
      if (index > -1) {
        selectedProducts.splice(index, 1);
        saveSelectedProducts();
        displaySelectedProducts();
        // Instantly remove green outline from products grid
        const productCards = document.querySelectorAll(
          ".products-grid .product-card"
        );
        productCards.forEach((gridCard) => {
          const name = gridCard.querySelector("h3")?.textContent;
          if (name === product.name) {
            gridCard.classList.remove("selected");
          }
        });
        // Refresh products grid to update outlines
        // Find currently displayed products
        const currentCategory = categoryFilter.value;
        loadProducts().then((products) => {
          const filteredProducts = products.filter(
            (product) => product.category === currentCategory
          );
          displayProducts(filteredProducts);
        });
      }
    });
    selectedProductsList.appendChild(card);
  });

  // Add "Clear Selected" button if there are products
  let clearBtn = document.getElementById("clearSelectedBtn");
  if (selectedProducts.length > 0) {
    if (!clearBtn) {
      clearBtn = document.createElement("button");
      clearBtn.id = "clearSelectedBtn";
      clearBtn.textContent = "Clear Selected";
      clearBtn.className = "generate-btn";
      clearBtn.addEventListener("click", () => {
        selectedProducts = [];
        saveSelectedProducts();
        displaySelectedProducts();
        // Refresh products grid to update outlines
        const currentCategory = categoryFilter.value;
        loadProducts().then((products) => {
          const filteredProducts = products.filter(
            (product) => product.category === currentCategory
          );
          displayProducts(filteredProducts);
        });
      });
      selectedProductsList.parentElement.appendChild(clearBtn);
    }
  } else {
    // Remove button if no products
    if (clearBtn) {
      clearBtn.remove();
    }
  }
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = "";

  // Create a tooltip div for product descriptions
  let tooltip = document.getElementById("productTooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "productTooltip";
    tooltip.className = "product-tooltip";
    tooltip.style.display = "none";
    document.body.appendChild(tooltip);
  }

  products.forEach((product) => {
    // Create product card
    const card = document.createElement("div");
    card.className = "product-card";

    // Add 'selected' class if product is selected
    if (selectedProducts.some((p) => p.name === product.name)) {
      card.classList.add("selected");
    }

    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
    `;

    // Show tooltip with description on hover
    card.addEventListener("mouseenter", function (e) {
      tooltip.innerHTML = product.description;
      tooltip.style.display = "block";
      // Position tooltip near mouse
      document.addEventListener("mousemove", moveTooltip);
    });

    card.addEventListener("mouseleave", function () {
      tooltip.style.display = "none";
      document.removeEventListener("mousemove", moveTooltip);
    });

    // Helper function to move tooltip with mouse
    function moveTooltip(e) {
      tooltip.style.left = e.pageX + 15 + "px";
      tooltip.style.top = e.pageY + 15 + "px";
    }

    // Add click event to select product
    card.addEventListener("click", function () {
      // Only add if not already selected
      if (!selectedProducts.some((p) => p.name === product.name)) {
        selectedProducts.push(product);
        saveSelectedProducts();
        displaySelectedProducts();
        displayProducts(products); // Update outlines
      }
    });

    productsContainer.appendChild(card);
  });
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

// Array to store chat messages (each message is {role, content})
const chatMessages = [];

/* Helper function to render chat bubbles in the chat window */
function renderChatWindow() {
  chatWindow.innerHTML = ""; // Clear previous messages

  chatMessages.forEach((msg) => {
    // Show user messages on the right, assistant (bot) messages on the left
    const bubble = document.createElement("div");
    // Use "assistant" instead of "bot" for OpenAI compatibility
    bubble.className =
      msg.role === "user" ? "chat-bubble user" : "chat-bubble bot";
    bubble.innerHTML = msg.content; // Already formatted HTML
    chatWindow.appendChild(bubble);
  });

  // Scroll to bottom so latest message is visible
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Chat form submission handler - sends user input to OpenAI as a L'Oréal chatbot helper */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get the user's question from the input box
  const chatInputElem = document.getElementById("chatInput");
  if (!chatInputElem) {
    chatWindow.innerHTML =
      "Error: Could not find the chat input box. Please make sure your HTML includes an input with id='chatInput'.";
    return;
  }
  const userInput = chatInputElem.value;

  // Push user's message as a bubble and clear input
  chatMessages.push({ role: "user", content: userInput });
  renderChatWindow();
  chatInputElem.value = ""; // Clear input bar

  // Show loading bubble for assistant (bot)
  chatMessages.push({ role: "assistant", content: "<i>Thinking...</i>" });
  renderChatWindow();

  // Always start with a system message at the beginning of the conversation
  // The assistant should randomly choose a common modern women's name (e.g., Emma, Olivia, Ava, Mia, Sophia, Harper, Ella, Grace, Lily, Zoe, etc.)
  // and stick with that name for the rest of the conversation.
  const systemMessage = {
    role: "system",
    content:
      "You are a loreal chatbot assistant, designed to answer questions about loreal products and routines. At the start of the conversation, randomly choose a common modern women's name (such as Emma, Olivia, Ava, Mia, Sophia, Harper, Ella, Grace, Lily, Zoe, etc.) and introduce yourself with that name. Use the same name for the rest of the conversation. Only reply with the message you would send to the user as the loreal chat assistant. Do not include any meta-comments or acknowledgements. If the user asks a question that does not relate to loreal, nicely and comedically tell them that you are here to assist them with loreal products and routines. If you include any titles, make them bold using <b> tags.",
  };

  // Prepare messages array: system message first, then all previous chat messages
  const messages = [
    systemMessage,
    ...chatMessages.map((m) => ({
      role: m.role,
      content: m.content.replace(/<[^>]+>/g, ""),
    })),
  ];

  // Use your API key from secrets.js
  const apiKey = OPENAI_API_KEY; // Make sure secrets.js defines OPENAI_API_KEY

  // Send request to OpenAI
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: messages,
      }),
    });

    const data = await response.json();

    // Log the response for debugging (students can see errors in the browser console)
    console.log("OpenAI API response:", data);

    // Remove loading bubble
    chatMessages.pop();

    // Check for errors in the response
    if (data.error) {
      chatMessages.push({
        role: "assistant",
        content: `Error: ${data.error.message}. Please check your API key in secrets.js and try again.`,
      });
      renderChatWindow();
      return;
    }

    // Check for a valid response and display it
    if (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      // Format the response for better readability
      const responseText = data.choices[0].message.content;
      const formattedResponse = responseText
        .split("\n\n")
        .map(
          (paragraph) =>
            `<p>${paragraph.replace(/\n/g, "<br>&nbsp;&nbsp;")}</p>`
        )
        .join("");
      chatMessages.push({ role: "assistant", content: formattedResponse });
    } else {
      chatMessages.push({
        role: "assistant",
        content:
          "Sorry, I couldn't get a response. Please check your API key and try again.",
      });
    }
    renderChatWindow();
  } catch (error) {
    // Remove loading bubble and show error
    chatMessages.pop();
    chatMessages.push({
      role: "assistant",
      content:
        "Error connecting to OpenAI. Please check your API key and try again.",
    });
    renderChatWindow();
  }
});

// Get reference to the generate button
const generateBtn = document.getElementById("generateRoutine");

// Add event listener for generate button
generateBtn.addEventListener("click", async () => {
  // Show loading bubble for assistant (bot)
  chatMessages.push({
    role: "assistant",
    content: "<i>Generating your routine...</i>",
  });
  renderChatWindow();

  // System message for routine generation
  // The assistant should use the same randomly chosen name for the rest of the conversation.
  const systemMessage = {
    role: "system",
    content:
      "You are a loreal chatbot who is designed to create a routine based on these products that the user has selected. Use the same randomly chosen common modern women's name you introduced yourself with earlier in this conversation. Only reply with the routine you would send to the user as the loreal chat assistant. Do not include any meta-comments or acknowledgements. Please use emojis to make the routine fun and easy to read, and do not use # or * characters in your response. If you include any titles, make them bold using <b> tags.",
  };

  // User message listing selected products
  const routineRequest = {
    role: "user",
    content: `Selected products:\n${selectedProducts
      .map((p) => `${p.name} (${p.brand})`)
      .join("\n")}`,
  };

  // Add the routine request to chatMessages so it is part of the conversation history
  chatMessages.push(routineRequest);

  // Prepare messages array: system message first, then all previous chat messages
  const messages = [
    systemMessage,
    ...chatMessages.map((m) => ({
      role: m.role,
      content: m.content.replace(/<[^>]+>/g, ""),
    })),
  ];

  // Use your API key from secrets.js
  const apiKey = OPENAI_API_KEY; // Make sure secrets.js defines OPENAI_API_KEY

  // Send request to OpenAI
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: messages,
      }),
    });

    const data = await response.json();

    // Remove loading bubble
    chatMessages.pop();

    // Check for a valid response and display it
    if (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      // Format the routine for better readability
      const routine = data.choices[0].message.content;
      const formattedRoutine = routine
        .split("\n\n")
        .map(
          (paragraph) =>
            `<p>${paragraph.replace(/\n/g, "<br>&nbsp;&nbsp;")}</p>`
        )
        .join("");

      // Add the routine response to chatMessages as an assistant message
      chatMessages.push({ role: "assistant", content: formattedRoutine });
      renderChatWindow();
    } else {
      chatMessages.push({
        role: "assistant",
        content: "Sorry, I couldn't generate a routine. Please try again.",
      });
      renderChatWindow();
    }
  } catch (error) {
    chatMessages.push({
      role: "assistant",
      content:
        "Error connecting to OpenAI. Please check your API key and try again.",
    });
    renderChatWindow();
  }
});

// On page load, restore selected products and display
loadSelectedProducts();
displaySelectedProducts();
// On page load, restore selected products and display
loadSelectedProducts();
displaySelectedProducts();
