document.addEventListener("DOMContentLoaded", () => {
  /**
   * Represents an elevator in a multi-floor building.
   * @class
   */
  class Elevator {
    /**
     * Creates an instance of an Elevator with a specific identifier and total number of floors.
     * @param {number} id - The unique identifier for the elevator.
     * @param {number} numFloors - The total number of floors in the building.
     */
    constructor(id, numFloors) {
      this.id = id;
      this.currentFloor = 0;
      this.moving = false;
      this.queue = [];
      this.icon = document.getElementById(`elevator-${id}`);
      this.totalFloors = numFloors;
    }

    /**
     * Retrieves the audio file for a specific floor.
     * @param {number} floor - The floor number for which to load the sound.
     * @returns {HTMLAudioElement} The audio element for the specified floor.
     */
    loadFloorSounds(floor) {
      return new Audio(`./src/assets/${floor}-floor.mp3`);
    }

    /**
     * Adds a floor to the elevator's queue and processes the next call if the elevator is not already moving.
     * @param {number} floor - The floor number to add to the queue.
     */
    addFloorToQueue(floor) {
      this.queue.push(floor);
      if (!this.moving) {
        this.processNextCall();
      }
    }

    /**
     * Processes the next floor call in the queue or signals the system if no more calls are pending.
     */
    processNextCall() {
      if (this.queue.length === 0) {
        this.moving = false;
        ElevatorSystem.assignElevatorToNextCall();
        return;
      }

      this.moving = true;
      const nextFloor = this.queue.shift();
      this.moveToFloor(nextFloor);
    }

    /**
     * Moves the elevator to the specified floor and updates the visual and operational status accordingly.
     * @param {number} floor - The target floor number.
     */
    moveToFloor(floor) {
      const buildingHeight =
        document.querySelector(".elevator-area").offsetHeight;
      const floorHeight = buildingHeight / this.totalFloors;
      const moveFloors = Math.abs(this.currentFloor - floor);
      const moveTime = moveFloors * 3; // 3 seconds per floor
      const targetYPosition = floor * floorHeight;

      this.icon.style.transition = `transform ${moveTime}s linear`;
      this.icon.style.transform = `translateY(-${targetYPosition}px)`;
      this.icon.src = "./src/assets/red.svg";

      this.showCountdown(floor, moveTime);

      setTimeout(() => {
        this.arriveAtFloor(floor);
      }, moveTime * 1000);
    }

    /**
     * Displays a countdown timer in the status table for the floor the elevator is moving to.
     * @param {number} floor - The target floor number.
     * @param {number} countdownTime - The countdown time in seconds.
     */
    showCountdown(floor, countdownTime) {
      const tableBody = document.getElementById("elevator-status-table");
      const row = tableBody.rows[this.totalFloors - floor - 1];
      const cell = row.cells[this.id - 1];
      let countdown = countdownTime;

      const countdownInterval = setInterval(() => {
        countdown -= 0.5;
        if (countdown <= 0) {
          clearInterval(countdownInterval);
          cell.textContent = "";
        } else {
          const minutes = Math.floor(countdown / 60);
          const seconds = Math.floor(countdown % 60);
          cell.textContent = `${
            minutes > 0 ? `${minutes} min ` : ""
          }${seconds} sec.`;
        }
      }, 500);
    }

    /**
     * Handles the arrival of the elevator at a specified floor, updates UI, and processes the next call.
     * @param {number} floor - The floor number where the elevator arrives.
     */
    arriveAtFloor(floor) {
      this.currentFloor = floor;
      this.icon.src = "./src/assets/green.svg";
      this.playSoundForFloor(floor);

      const button = document.querySelector(`.call-btn[data-floor="${floor}"]`);
      button.classList.remove("waiting");
      button.textContent = "Arrived";
      button.classList.add("arrived");
      button.disabled = true;

      setTimeout(() => {
        button.textContent = "Call";
        button.classList.remove("arrived");
        button.disabled = false;
        this.icon.src = "./src/assets/black.svg";
        this.processNextCall();
      }, 2000);
    }

    /**
     * Plays the sound associated with the current floor.
     * @param {number} floor - The floor number to play the sound for.
     */
    playSoundForFloor(floor) {
      const sound = this.loadFloorSounds(floor);
      if (sound) {
        sound.play();
      }
    }
  }

  /**
   * Manages a system of elevators and handles global elevator calls.
   * @class
   */
  class ElevatorSystem {
    /**
     * Initializes the elevator system with a specific number of elevators and floors.
     * @param {number} numElevators - The number of elevators in the system.
     * @param {number} numFloors - The total number of floors in the building.
     */
    static initialize(numElevators, numFloors) {
      this.elevators = Array.from(
        { length: numElevators },
        (_, i) => new Elevator(i + 1, numFloors)
      );
      this.globalQueue = [];
    }

    /**
     * Responds to a call button press at a specific floor, queuing the request.
     * @param {number} floor - The floor number where the call was made.
     */
    static handleCall(floor) {
      const button = document.querySelector(`.call-btn[data-floor="${floor}"]`);
      button.classList.add("waiting");
      button.textContent = "Waiting";
      button.disabled = true;
      this.globalQueue.push(floor);
      this.assignElevatorToNextCall();
    }

    /**
     * Assigns an elevator to respond to the next call in the queue based on proximity and availability.
     */
    static assignElevatorToNextCall() {
      if (this.globalQueue.length === 0) return;

      const nextFloor = this.globalQueue[0];
      let closestElevatorIndex = -1;
      let minDistance = Infinity;

      this.elevators.forEach((elevator, index) => {
        if (!elevator.moving) {
          const distance = Math.abs(elevator.currentFloor - nextFloor);
          if (distance < minDistance) {
            minDistance = distance;
            closestElevatorIndex = index;
          }
        }
      });

      if (closestElevatorIndex !== -1) {
        const elevator = this.elevators[closestElevatorIndex];
        elevator.addFloorToQueue(this.globalQueue.shift());
      }
    }
  }

  // Initialize the elevator system with 5 elevators and 10 floors
  ElevatorSystem.initialize(5, 10);

  // Set up event listeners for elevator call buttons
  const callButtons = document.querySelectorAll(".call-btn");
  callButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const floor = parseInt(button.dataset.floor);
      ElevatorSystem.handleCall(floor);
    });
  });
});
