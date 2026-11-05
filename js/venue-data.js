const seatCategories = [
  { id: "vip", name: "VIP", price: 120, count: 40 },
  { id: "premium", name: "Premium", price: 85, count: 60 },
  { id: "standard", name: "Standard", price: 55, count: 84 },
  { id: "fan-zone", name: "Fan Zone", price: 30, count: 80 },
];
const rowSeatCounts = [14, 16, 18, 18, 18, 20, 20, 20, 20, 20, 20, 20, 20, 20];
const unavailableSeats = new Set(["2-8", "3-5", "6-10", "9-3", "12-18"]);

const venueContainer = document.querySelector("#venue-sections");
const seatDetailsContainer = document.querySelector("#seat-details");
const addToCartButton = document.querySelector("#add-to-cart");
const selectionMessage = document.querySelector("#selection-message");

const navCartBtn = document.querySelector("#nav-cart-btn");
const navCartBadge = document.querySelector("#nav-cart-badge");
const cartModalOverlay = document.querySelector("#cart-modal-overlay");
const closeModalBtn = document.querySelector("#close-modal-btn");
const modalCartItems = document.querySelector("#modal-cart-items");
const modalCartTotal = document.querySelector("#modal-cart-total");
const confirmOrderBtn = document.querySelector("#confirm-order-btn");


function generateAuditorium() {
  if (!venueContainer) {
    console.error('Could not find "#venue-sections" in index.html.');
    return;
  }

  const auditorium = document.createElement("section");
  auditorium.className = "venue-section venue-section--auditorium";

  const heading = document.createElement("h3");
  heading.textContent = "Main Auditorium";

  const description = document.createElement("p");
  description.textContent =
    "Choose a seat from the map. Prices depend on the seat's position.";

  const seatingArea = document.createElement("div");
  seatingArea.className = "auditorium-seating";
  const stage = document.createElement("div");
  stage.className = "stage";

  const stageText = document.createElement("span");
  stageText.textContent = "STAGE";

  stage.appendChild(stageText);

  const allSeats = [];

  rowSeatCounts.forEach((seatCount, rowIndex) => {
    for (let seatNumber = 1; seatNumber <= seatCount; seatNumber++) {
      const center = (seatCount + 1) / 2;
      const distanceFromCenter = Math.abs(seatNumber - center);

      allSeats.push({
        row: rowIndex + 1,
        seat: seatNumber,
        score: rowIndex * 25 + distanceFromCenter * 12,
      });
    }
  });

  allSeats.sort((a, b) => a.score - b.score);

  let categoryIndex = 0;
  let categorySeatCount = 0;

  allSeats.forEach((seat) => {
    while (categorySeatCount >= seatCategories[categoryIndex].count) {
      categoryIndex++;
      categorySeatCount = 0;
    }

    seat.category = seatCategories[categoryIndex];
    categorySeatCount++;
  });

  allSeats.sort((a, b) => a.row - b.row || a.seat - b.seat);

  rowSeatCounts.forEach((seatCount, rowIndex) => {
    const rowNumber = rowIndex + 1;

    const row = document.createElement("div");
    row.className = "seat-row";
    row.dataset.row = rowNumber;

    const leftBlock = document.createElement("div");
    leftBlock.className = "seat-block";

    const aisle = document.createElement("div");
    aisle.className = "seat-aisle";
    aisle.setAttribute("aria-hidden", "true");

    const rightBlock = document.createElement("div");
    rightBlock.className = "seat-block";

    const leftCount = Math.ceil(seatCount / 2);

    for (let seatNumber = 1; seatNumber <= seatCount; seatNumber++) {
      const seatData = allSeats.find(
        (seat) => seat.row === rowNumber && seat.seat === seatNumber,
      );

      const seatKey = `${rowNumber}-${seatNumber}`;
      const unavailable = unavailableSeats.has(seatKey);

      const button = document.createElement("button");
      button.type = "button";
      button.className = `seat seat--${seatData.category.id}`;
      button.textContent = seatNumber;
      button.setAttribute("draggable","false");

      button.dataset.section = seatData.category.id;
      button.dataset.sectionName = seatData.category.name;
      button.dataset.row = rowNumber;
      button.dataset.seat = seatNumber;
      button.dataset.price = seatData.category.price;
      button.dataset.state = unavailable ? "unavailable" : "available";

      button.disabled = unavailable;

      button.setAttribute(
        "aria-label",
        `${seatData.category.name}, row ${rowNumber}, ` +
          `seat ${seatNumber}, ${seatData.category.price} AZN` +
          (unavailable ? ", unavailable" : ""),
      );

      if (unavailable) {
        button.classList.add("seat--unavailable");
      }

      if (seatNumber <= leftCount) {
        leftBlock.appendChild(button);
      } else {
        rightBlock.appendChild(button);
      }
    }

    row.append(leftBlock, aisle, rightBlock);
    seatingArea.appendChild(row);
  });

  seatingArea.prepend(stage);
  auditorium.append(heading, description,seatingArea);

  venueContainer.replaceChildren(auditorium);
}

generateAuditorium();

const selectedSeats = new Set();
const MAX_SEATS = 5;

const cartItemContainer = document.querySelector("#cart-items");
const cartCountElement = document.querySelector("#cart-count");
const cartTotalElement = document.querySelector("#cart-total");

const cart = new Map();

const CART_STORAGE_KEY = "eTicketCart";
const CART_EXPIRATION_TIME = 10 * 60 * 1000; // converting 10 minutes to milliseconds

function saveCart(){
  const cartData = {
    items: Array.from(cart.entries()),
    savedAt: Date.now(),
  };
  
  localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify(cartData)
  );
}

function loadCart() {
  const savedData = localStorage.getItem(CART_STORAGE_KEY);

  if(!savedData){return;}

  const cartData = JSON.parse(savedData);

  const currentTime = Date.now();
  const elapsedTime = currentTime - cartData.savedAt;

  if(elapsedTime >= CART_EXPIRATION_TIME){
    localStorage.removeItem(CART_STORAGE_KEY);
    return;
  }

  cartData.items.forEach(([seatKey, ticket]) => {
    cart.set(seatKey, ticket);

    const seat = venueContainer.querySelector(
      `[data-row="${ticket.row}"][data-seat="${ticket.seat}"]`
    );

    if(seat){
      seat.dataset.state = "in-cart";
      seat.classList.remove("seat--inspected");
      seat.classList.add("seat--in-cart");
    }
  });
}

function updateTicketDetails() {
  if (!seatDetailsContainer) return;

  if (selectedSeats.size === 0) {
    seatDetailsContainer.innerHTML = `
      <div class="selection-placeholder">
        <div class="placeholder-icon">⌖</div>
        <p>No seats selected</p>
        <span>Select seats from the auditorium.</span>
      </div>
    `;
  } else {
    let total = 0;

    const seatList = Array.from(selectedSeats);

    seatDetailsContainer.innerHTML = `
      <p><strong>Selected seats: ${selectedSeats.size}/${MAX_SEATS}</strong></p>
      <div class="selected-seat-list">
        ${seatList
          .map((seat) => {
            const price = Number(seat.dataset.price);
            total += price;

            return `
            <div class="selected-seat-item">
              <div>
                <strong>${seat.dataset.sectionName}</strong>
                <p>Row ${seat.dataset.row}, Seat ${seat.dataset.seat}</p>
              </div>
              <strong>${price.toFixed(2)} AZN</strong>
            </div>
          `;
          })
          .join("")}
      </div>
      <div class="selected-seat-total">
        <span>Total amount</span>
        <strong>${total.toFixed(2)} AZN</strong>
      </div>
    `;
  }

  if (addToCartButton) {
    addToCartButton.disabled = selectedSeats.size === 0;
  }

  if (selectionMessage) {
    const remainingSeats = MAX_SEATS - cart.size - selectedSeats.size;

    if (remainingSeats === 0) {
      selectionMessage.textContent =
        `Maximum reached: you can book up to ${MAX_SEATS} tickects`;
    } else if (selectedSeats.size > 0) {
      selectionMessage.textContent = `${selectedSeats.size} seat(s) selected. You can add ${remainingSeats} more tickect(s) to your booking.`;
    } else if (cart.size > 0) {
      selectionMessage.textContent = `${cart.size} ticket(s) in your cart. You can select ${remainingSeats} more.`;
    } else {
      selectionMessage.textContent = `Choose a seat to get started.`;
    }
  }
}

if (venueContainer) {
  venueContainer.addEventListener("click", (event) => {
    const seat = event.target.closest(".seat");

    if (
      !seat ||
      !venueContainer.contains(seat) ||
      seat.disabled ||
      seat.dataset.state === "in-cart"
    ) {
      return;
    }

    if (selectedSeats.has(seat)) {
      selectedSeats.delete(seat);
      seat.dataset.state = "available";
      seat.classList.remove("seat--inspected");

      updateTicketDetails();
      return;
    }

    if (selectedSeats.size + cart.size >= MAX_SEATS) {
      if (selectionMessage) {
        selectionMessage.textContent =
          `You can select a maximum of ${MAX_SEATS} seats. ` +
          "Deselect a seat to choose another.";
      }
      return;
    }

    selectedSeats.add(seat);
    seat.dataset.state = "inspected";
    seat.classList.add("seat--inspected");

    updateTicketDetails();
  });
}

function updateCart() {
  if (!cartItemContainer || !cartCountElement || !cartTotalElement) {
    return;
  }

  cartItemContainer.replaceChildren();

  let total = 0;

  if (cart.size === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "empty-cart";

    const message = document.createElement("p");
    message.textContent = "Your cart is empty.";

    const description = document.createElement("span");
    description.textContent = "Your selected tickets will appear here.";

    emptyMessage.append(message, description);
    cartItemContainer.appendChild(emptyMessage);
  } else {
    cart.forEach((ticket, seatKey) => {
      total += ticket.price;

      const item = document.createElement("div");
      item.className = "cart-item";

      const details = document.createElement("div");
      details.className = "cart-item-details";

      const category = document.createElement("strong");
      category.textContent = ticket.sectionName;

      const seatInformation = document.createElement("p");
      seatInformation.textContent = `Row ${ticket.row}, Seat ${ticket.seat}`;

      details.append(category, seatInformation);

      const price = document.createElement("strong");
      price.className = "cart-item-price";
      price.textContent = `${ticket.price.toFixed(2)} AZN`;

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "remove-ticket-button";
      removeButton.textContent = "Remove";
      removeButton.dataset.seatKey = seatKey;

      removeButton.setAttribute(
        "aria-label",
        `Remove row ${ticket.row}, seat ${ticket.seat}`,
      );

      item.append(details, price, removeButton);
      cartItemContainer.appendChild(item);
    });
  }

  cartCountElement.textContent = `${cart.size} ${cart.size === 1 ? "ticket" : "tickets"}`;

  cartTotalElement.textContent = `${total.toFixed(2)} AZN`;
 //related to modal
  if (navCartBadge) {
    if (cart.size > 0) {
      navCartBadge.textContent = cart.size;
      navCartBadge.style.display = "flex";
    } else {
      navCartBadge.style.display = "none";
    }
  }
 
  if (modalCartItems && modalCartTotal) {
    modalCartItems.innerHTML = cartItemContainer.innerHTML;
    modalCartTotal.textContent = `${total.toFixed(2)} AZN`;
  }
  if (confirmOrderBtn) {
    confirmOrderBtn.disabled = cart.size === 0;
  }
}

function addSelectedSeatsToCart() {
  if (selectedSeats.size === 0) {
    return;
  }

  if (cart.size + selectedSeats.size > MAX_SEATS) {
    if (selectionMessage) {
      selectionMessage.textContent =
        `You can add a maximum of ${MAX_SEATS} ticket(s) to your cart.`;
    }
    return;
  }

  selectedSeats.forEach((seat) => {
    const seatKey = `${seat.dataset.row}-${seat.dataset.seat}`;

    if (cart.has(seatKey)) {
      return;
    }

    const ticket = {
      section: seat.dataset.section,
      sectionName: seat.dataset.sectionName,
      row: Number(seat.dataset.row),
      seat: Number(seat.dataset.seat),
      price: Number(seat.dataset.price),
    };

    cart.set(seatKey, ticket);

    seat.dataset.state = "in-cart";
    seat.classList.remove("seat--inspected");
    seat.classList.add("seat--in-cart");
  });

  selectedSeats.clear();

  saveCart();
  updateCart();
  updateTicketDetails();
}

if (addToCartButton) {
  addToCartButton.addEventListener("click", addSelectedSeatsToCart);
}

if (cartItemContainer) {
  cartItemContainer.addEventListener("click", (event) => {
    const removeButton = event.target.closest(".remove-ticket-button");

    if (!removeButton) {
      return;
    }

    const seatKey = removeButton.dataset.seatKey;
    const ticket = cart.get(seatKey);

    if (!ticket) {
      return;
    }

    cart.delete(seatKey);
    saveCart(); // update localStroage; adding and removing

    const seat = Array.from(venueContainer.querySelectorAll(".seat")).find(
      (seat) =>
        seat.dataset.row === String(ticket.row) &&
        seat.dataset.seat === String(ticket.seat),
    );

    if (seat) {
      seat.dataset.state = "available";
      seat.classList.remove("seat--in-cart");
    }

    updateCart();
    updateTicketDetails();
  });
}

if (addToCartButton) {
  addToCartButton.disabled = true;
}

updateTicketDetails();

const venueViewport = document.querySelector("#venue-viewport");
const zoomInButton = document.querySelector("#zoom-in");
const zoomOutButton = document.querySelector("#zoom-out");
const moveUpButton = document.querySelector("#move-up");
const moveDownButton = document.querySelector("#move-down");
const moveLeftButton = document.querySelector("#move-left");
const moveRightButton = document.querySelector("#move-right");
const resetViewButton = document.querySelector("#reset-view");

let zoomLevel = 1;
let panX = 0;
let panY = 0;

const MIN_ZOOM = 0.85;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.45;
const MOVE_STEP = 60;

function updateVenueView() {
  if (!venueContainer || !venueViewport) return;

  const viewportWidth =
    venueViewport.clientWidth -
    parseFloat(getComputedStyle(venueViewport).paddingLeft) -
    parseFloat(getComputedStyle(venueViewport).paddingRight);

  const viewportHeight =
    venueViewport.clientHeight -
    parseFloat(getComputedStyle(venueViewport).paddingTop) -
    parseFloat(getComputedStyle(venueViewport).paddingBottom);

  const venueWidth = venueContainer.offsetWidth;
  const venueHeight = venueContainer.offsetHeight;

  const maxPanX = Math.max(
    0,
    (venueWidth * zoomLevel - viewportWidth) / 2
  );

  const maxPanY = Math.max(
    0,
    (venueHeight * zoomLevel - viewportHeight) / 2
  );

  panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
  panY = Math.max(-maxPanY, Math.min(maxPanY, panY));

  venueContainer.style.transform =
    `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
}

if (zoomInButton) {
  zoomInButton.addEventListener("click", () => {
    zoomLevel = Math.min(MAX_ZOOM, zoomLevel + ZOOM_STEP);
    updateVenueView();
  });
}

if (zoomOutButton) {
  zoomOutButton.addEventListener("click", () => {
    zoomLevel = Math.max(MIN_ZOOM, zoomLevel - ZOOM_STEP);
    updateVenueView();
  });
}

if (moveUpButton) {
  moveUpButton.addEventListener("click", () => {
    panY += MOVE_STEP;
    updateVenueView();
  });
}

if (moveDownButton) {
  moveDownButton.addEventListener("click", () => {
    panY -= MOVE_STEP;
    updateVenueView();
  });
}

if (moveLeftButton) {
  moveLeftButton.addEventListener("click", () => {
    panX += MOVE_STEP;
    updateVenueView();
  });
}

if (moveRightButton) {
  moveRightButton.addEventListener("click", () => {
    panX -= MOVE_STEP;
    updateVenueView();
  });
}

if (resetViewButton) {
  resetViewButton.addEventListener("click", () => {
    zoomLevel = 1;
    panX = 0;
    panY = 0;

    updateVenueView();
  });
}

if (venueViewport && venueContainer) {
  venueViewport.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();

      const oldZoom = zoomLevel;

      const newZoom =
        event.deltaY < 0
          ? Math.min(MAX_ZOOM, zoomLevel + ZOOM_STEP)
          : Math.max(MIN_ZOOM, zoomLevel - ZOOM_STEP);

      const rect = venueContainer.getBoundingClientRect();

      const centerX = rect.left + venueContainer.offsetWidth * oldZoom / 2;
      const centerY = rect.top + venueContainer.offsetHeight * oldZoom / 2;

      const mouseFromCenterX = event.clientX - centerX;
      const mouseFromCenterY = event.clientY - centerY;

      panX += mouseFromCenterX * (1 - newZoom / oldZoom);
      panY += mouseFromCenterY * (1 - newZoom / oldZoom);

      zoomLevel = newZoom;

      updateVenueView();
    },
    { passive: false }
  );
}

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartPanX = 0;
let dragStartPanY = 0;

if (venueViewport) {
  venueViewport.addEventListener("pointerdown", (event) => {
    
    if (event.pointerType !== "mouse" || event.button !== 0) {
      return;
    }

    isDragging = true;

    dragStartX = event.clientX;
    dragStartY = event.clientY;

    dragStartPanX = panX;
    dragStartPanY = panY;

    event.preventDefault();
  });

  venueViewport.addEventListener("pointermove", (event) => {
    if (!isDragging) return;

    const moveX = event.clientX - dragStartX;
    const moveY = event.clientY - dragStartY;

  
    if (Math.abs(moveX) < 4 && Math.abs(moveY) < 4) {
      return;
    }

    panX = dragStartPanX + moveX;
    panY = dragStartPanY + moveY;

    venueViewport.style.cursor = "grabbing";

    updateVenueView();
  });

  function stopDragging() {
    isDragging = false;
    venueViewport.style.cursor = "grab";
  }

  venueViewport.addEventListener("pointerup", stopDragging);
  venueViewport.addEventListener("pointercancel", stopDragging);
}

loadCart(); // this will restore the saved tickets and their seats
updateVenueView(); // this will initialize the venue
updateCart();  // this will display restored tickets
updateTicketDetails(); // this will refresh the selection information

// this will open modal
if (navCartBtn) {
  navCartBtn.addEventListener("click", (e) => {
    e.preventDefault();
    cartModalOverlay.style.display = "flex";
  });
}

//this will close modal via Button
if (closeModalBtn) {
  closeModalBtn.addEventListener("click", () => {
    cartModalOverlay.style.display = "none";
  });
}

// this will close Modal via clicking outside the box
if (cartModalOverlay) {
  cartModalOverlay.addEventListener("click", (e) => {
    if (e.target === cartModalOverlay) {
      cartModalOverlay.style.display = "none";
    }
  });
}

// this will handle Remove buttons inside the Modal dynamically
if (modalCartItems) {
  modalCartItems.addEventListener("click", (event) => {
    const removeButton = event.target.closest(".remove-ticket-button");
    if (!removeButton) return;

    const seatKey = removeButton.dataset.seatKey;
    const ticket = cart.get(seatKey);
    if (!ticket) return;

    cart.delete(seatKey);
    saveCart();

    const seat = Array.from(venueContainer.querySelectorAll(".seat")).find(
      (s) => s.dataset.row === String(ticket.row) && s.dataset.seat === String(ticket.seat)
    );

    if (seat) {
      seat.dataset.state = "available";
      seat.classList.remove("seat--in-cart");
    }

    updateCart();
    updateTicketDetails();
  });
}

if (confirmOrderBtn) {
  confirmOrderBtn.addEventListener("click", () => {
    if (cart.size === 0) return;
    cartModalOverlay.style.display = "none";
    alert("This service is not available. Thanks for your understanding! 😊");
  });
}