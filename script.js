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

/* Create HTML for displaying product cards */
// Array to store selected products
const selectedProducts = [];

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
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = "";
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

    // Add click event to select product
    card.addEventListener("click", function () {
      // Only add if not already selected
      if (!selectedProducts.some((p) => p.name === product.name)) {
        selectedProducts.push(product);
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

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});
