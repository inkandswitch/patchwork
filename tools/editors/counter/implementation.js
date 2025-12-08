/** @typedef {{ count: number }} CounterDoc */

/**
 * Counter DataType - defines how to initialize and get the title
 */
export const CounterDataType = {
  init(doc) {
    doc.count = 0;
  },
  getTitle(doc) {
    return `Counter: ${doc.count}`;
  },
};

/**
 * Render the counter tool using plain DOM
 */
export function renderCounter(handle, element) {
  // Create container
  const container = document.createElement("div");
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 24px;
    font-family: system-ui, -apple-system, sans-serif;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: #eee;
  `;

  // Create count display
  const countDisplay = document.createElement("div");
  countDisplay.style.cssText = `
    font-size: 96px;
    font-weight: 200;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 4px 20px rgba(99, 102, 241, 0.5);
    transition: transform 0.1s ease-out;
  `;

  // Create button container
  const buttonContainer = document.createElement("div");
  buttonContainer.style.cssText = `
    display: flex;
    gap: 16px;
  `;

  // Button styles
  const buttonStyle = `
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: none;
    font-size: 32px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // Decrement button
  const decrementBtn = document.createElement("button");
  decrementBtn.textContent = "−";
  decrementBtn.style.cssText =
    buttonStyle +
    `
    background: linear-gradient(145deg, #e74c3c, #c0392b);
    color: white;
    box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);
  `;
  decrementBtn.onmouseenter = () => {
    decrementBtn.style.transform = "scale(1.1)";
    decrementBtn.style.boxShadow = "0 6px 20px rgba(231, 76, 60, 0.6)";
  };
  decrementBtn.onmouseleave = () => {
    decrementBtn.style.transform = "scale(1)";
    decrementBtn.style.boxShadow = "0 4px 15px rgba(231, 76, 60, 0.4)";
  };

  // Reset button
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "↺";
  resetBtn.style.cssText =
    buttonStyle +
    `
    background: linear-gradient(145deg, #6c757d, #495057);
    color: white;
    box-shadow: 0 4px 15px rgba(108, 117, 125, 0.4);
  `;
  resetBtn.onmouseenter = () => {
    resetBtn.style.transform = "scale(1.1)";
    resetBtn.style.boxShadow = "0 6px 20px rgba(108, 117, 125, 0.6)";
  };
  resetBtn.onmouseleave = () => {
    resetBtn.style.transform = "scale(1)";
    resetBtn.style.boxShadow = "0 4px 15px rgba(108, 117, 125, 0.4)";
  };

  // Increment button
  const incrementBtn = document.createElement("button");
  incrementBtn.textContent = "+";
  incrementBtn.style.cssText =
    buttonStyle +
    `
    background: linear-gradient(145deg, #27ae60, #219a52);
    color: white;
    box-shadow: 0 4px 15px rgba(39, 174, 96, 0.4);
  `;
  incrementBtn.onmouseenter = () => {
    incrementBtn.style.transform = "scale(1.1)";
    incrementBtn.style.boxShadow = "0 6px 20px rgba(39, 174, 96, 0.6)";
  };
  incrementBtn.onmouseleave = () => {
    incrementBtn.style.transform = "scale(1)";
    incrementBtn.style.boxShadow = "0 4px 15px rgba(39, 174, 96, 0.4)";
  };

  // Assemble DOM
  buttonContainer.append(decrementBtn, resetBtn, incrementBtn);
  container.append(countDisplay, buttonContainer);
  element.appendChild(container);

  // Update display from document
  function updateDisplay() {
    const doc = handle.doc();
    if (doc) {
      countDisplay.textContent = String(doc.count);
      // Quick scale animation
      countDisplay.style.transform = "scale(1.05)";
      setTimeout(() => {
        countDisplay.style.transform = "scale(1)";
      }, 100);
    }
  }

  // Button handlers
  incrementBtn.onclick = () => {
    handle.change((doc) => {
      doc.count += 1;
    });
  };

  decrementBtn.onclick = () => {
    handle.change((doc) => {
      doc.count -= 1;
    });
  };

  resetBtn.onclick = () => {
    handle.change((doc) => {
      doc.count = 0;
    });
  };

  // Initial render
  updateDisplay();

  // Subscribe to document changes
  handle.on("change", updateDisplay);

  // Return cleanup function
  return () => {
    handle.off("change", updateDisplay);
    container.remove();
  };
}

