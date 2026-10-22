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

let inspectedSeat = null;

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

  auditorium.append(heading, description, stage, seatingArea);

  venueContainer.replaceChildren(auditorium);
}

generateAuditorium();

if (venueContainer) {
  venueContainer.addEventListener("click", (event) => {
    const seat = event.target.closest(".seat");

    if (!seat || !venueContainer.contains(seat)) {
      return;
    }

    if (seat.disabled) {
      return;
    }

    if (inspectedSeat && inspectedSeat.dataset.state === "inspected") {
      inspectedSeat.dataset.state = "available";
      inspectedSeat.classList.remove("seat--inspected");
    }

    inspectedSeat = seat;

    const sectionName = seat.dataset.sectionName;
    const rowNumber = seat.dataset.row;
    const seatNumber = seat.dataset.seat;
    const price = Number(seat.dataset.price);

    if (seat.dataset.state !== "in-cart") {
      seat.dataset.state = "inspected";
      seat.classList.add("seat--inspected");
    }

    if (seatDetailsContainer) {
      seatDetailsContainer.innerHTML = `
                <div class="selected-seat-details">
                    <p><strong>Section:</strong><span>${sectionName}</span></p>
                    <p><strong>Row:</strong><span>${rowNumber}</span></p>
                    <p><strong>Seat:</strong><span>${seatNumber}</span></p>
                    <p><strong>Price:</strong><span>${price.toFixed(2)} AZN</span></p>
                </div>
            `;
    }

    if (addToCartButton) {
      addToCartButton.disabled = seat.dataset.state === "in-cart";
    }

    if (selectionMessage) {
      selectionMessage.textContent =
        seat.dataset.state === "in-cart"
          ? "This seat is already in your cart."
          : "Seat inspected. Add it to your cart when ready.";
    }
  });
}
if (addToCartButton) {
  addToCartButton.disabled = true;
}
