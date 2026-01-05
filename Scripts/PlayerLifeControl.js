/**
 * @file Life for one player
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
(function Controls(ns) {
	ns.PlayerLifeEl = class PlayerLife extends HTMLElement {
		static InstanceCount = 0; // Global count of instances created
		static InstanceMap = {}; // Dynamic map of IDs to instances of the element currently attached

		// Element name
		static Name = "gw-player-life";

		// Attributes whose changes we respond to
		static observedAttributes = [];

		// Element CSSStyleSheet
		static #CommonStyleSheet = new CSSStyleSheet();
		static #CommonStyleAttribute = `data-${PlayerLife.Name}-style`;
		static {
			PlayerLife.#CommonStyleSheet.replaceSync(`${PlayerLife.Name} {
				contain: strict;
				position: relative;

				display: grid;
				grid-template-rows: 1fr 44px 44px;
				grid-template-columns: 1fr 1fr;

				gw-progress-ring {
					z-index: 1;
					justify-self: center;
					grid-column: 1 / span 2;
					grid-row: 1 / span 1;
					height: 100%;
				}

				.accept {
					grid-column: 1 / span 2;
					grid-row: 1 / span 1;

					z-index: 3;

					border-radius: 100%;
					justify-self: center;
					align-self: center;
					height: 60%;
					aspect-ratio: 1 / 1;

					display: grid;
					justify-content: center;
					align-content: center;

					font-size: 2em;

					--btn-transparency: 50%;

					&:empty {
						display: none;
					}

					.content {
						display: grid;
						grid-template-rows: auto auto;
						align-items: center;
						align-content: center;
						border-radius: 100%;
						padding: 20px;
						background-color: var(--btn-color);
						aspect-ratio: 1 / 1;

						.result {
							font-weight: bold;
							font-size: 1.5em;
						}
					}
				}

				.adjuster {
					&:is(div) {
						z-index: 2;
						grid-row: 1 / -1;
						opacity: 0.3;

						&.plus-one {
							grid-column: 2 / span 1;
						}

						&.minus-one {
							grid-column: 1 / span 1;
						}
					}
					
					&:is(button) {
						z-index: 2;

						display: grid;
						grid-template-columns: auto auto;
						justify-content: center;
						align-items: center;
						gap: 5px;
						font-size: 1.5em;

						&.minus-one {
							grid-column: 1;
							grid-row: 2;
						}
						&.plus-one {
							grid-column: 2;
							grid-row: 2;
						}
						&.minus-five {
							grid-column: 1;
							grid-row: 3;
						}
						&.plus-five {
							grid-column: 2;
							grid-row: 3;
						}
					}
				}
				
				&:has(.plus-one:hover) {
					.plus-one {
						--btn-color: lightsteelblue;
						background-color: lightsteelblue;
					}
				}
				&:has(.minus-one:hover) {
					.minus-one {
						--btn-color: lightsteelblue;
						background-color: lightsteelblue;
					}
				}
			}`);
		}

		InstanceId; // Identifier for this instance of the element
		IsInitialized; // Whether the element has rendered its content

		#StyleSheet; // CSSStyleSheet for this instance
		#StyleAttribute; // Identifying attribute for this instance's CSSStyleSheet

		#ResizeObserver = new ResizeObserver((entries) => {
			const contentBoxSize = entries[0].contentBoxSize[0];
			this.#StyleSheet.replaceSync(`${PlayerLife.Name}[data-instance="${this.InstanceId}"] {
				width: min(${contentBoxSize.inlineSize}px, ${contentBoxSize.blockSize}px);
			}`);
		});

		#StagedModify = 0;

		/** Creates an instance */
		constructor() {
			super();
			if(!this.getId) {
				// We're not initialized correctly. Attempting to fix:
				Object.setPrototypeOf(this, customElements.get(PlayerLife.Name).prototype);
			}
			this.InstanceId = PlayerLife.InstanceCount++;

			this.#StyleSheet = new CSSStyleSheet();
			this.#StyleAttribute = `data-${this.getId("style")}`;
		}

		/** Shortcut for the root node of the element */
		get Root() {
			return this.getRootNode();
		}
		/** Looks up the <head> element (or a fascimile thereof in the shadow DOM) for the element's root */
		get Head() {
			if(this.Root.head) {
				return this.Root.head;
			}
			if(this.Root.getElementById("gw-head")) {
				return this.Root.getElementById("gw-head");
			}
			const head = document.createElement("div");
			head.setAttribute("id", "gw-head");
			this.Root.prepend(head);
			return head;
		}

		/**
		 * Generates a globally unique ID for a key unique to the custom element instance
		 * @param {String} key Unique key within the custom element
		 * @returns A globally unique ID
		 */
		getId(key) {
			return `${PlayerLife.Name}-${this.InstanceId}-${key}`;
		}
		/**
		 * Finds an element within the custom element created with an ID from getId
		 * @param {String} key Unique key within the custom element
		 * @returns The element associated with the key
		 */
		getRef(key) {
			return this.querySelector(`#${CSS.escape(this.getId(key))}`);
		}

		/** Handler invoked when the element is attached to the page */
		connectedCallback() {
			this.onAttached();
		}
		/** Handler invoked when the element is moved to a new document via adoptNode() */
		adoptedCallback() {
			this.onAttached();
		}
		/** Handler invoked when the element is disconnected from the document */
		disconnectedCallback() {
			delete PlayerLife.InstanceMap[this.InstanceId];
		}
		/** Handler invoked when any of the observed attributes are changed */
		attributeChangedCallback(name, oldValue, newValue) {
			
		}

		/** Performs setup when the element has been sited */
		onAttached() {
			if(!this.Head.hasAttribute(PlayerLife.#CommonStyleAttribute)) {
				this.Head.setAttribute(PlayerLife.#CommonStyleAttribute, "");
				this.Root.adoptedStyleSheets.push(PlayerLife.#CommonStyleSheet);
			}
			if(!this.Head.hasAttribute(this.#StyleAttribute)) {
				this.Head.setAttribute(this.#StyleAttribute, "");
				this.Root.adoptedStyleSheets?.push(this.#StyleSheet);
			}
			this.setAttribute("data-instance", this.InstanceId);

			PlayerLife.InstanceMap[this.InstanceId] = this;
			if(document.readyState === "loading") {
				document.addEventListener("DOMContentLoaded", () => {
					this.#initialize();
				});
			}
			else {
				this.#initialize();
			}
			this.#ResizeObserver.disconnect();
			this.#ResizeObserver.observe(this.parentElement);
		}

		/** First-time setup */
		#initialize() {
			if(this.IsInitialized) { return; }

			this.innerHTML = `
				<gw-progress-ring
					id="${this.getId("ring")}"
					name="${this.getAttribute("key")} Life Total"
					numerator="40"
					denominator="40"
				></gw-progress-ring>
				<div id=${this.getId("divPlusOne")} class="adjuster plus-one" aria-hidden="true"></div>
				<div id=${this.getId("divMinusOne")} class="adjuster minus-one" aria-hidden="true"></div>
				<button id="${this.getId("btnMinusOne")}" class="adjuster minus-one">
					<gw-icon iconKey="minus" name="Subtract"></gw-icon>
					1
				</button>
				<button id="${this.getId("btnPlusOne")}" class="adjuster plus-one">
					<gw-icon iconKey="plus" name="Add"></gw-icon>
					1
				</button>
				<button id="${this.getId("btnMinusFive")}" class="adjuster minus-five">
					<gw-icon iconKey="minus" name="Subtract"></gw-icon>
					5
				</button>
				<button id="${this.getId("btnPlusFive")}" class="adjuster plus-five">
					<gw-icon iconKey="plus" name="Add"></gw-icon>
					5
				</button>
				<button id="${this.getId("btnAccept")}"
					aria-labelledby="spnAcceptLbl ${this.getId("btnAccept")}"
					class="accept"
				></button>
			`;

			this.getRef("divPlusOne").addEventListener("click", () => {this.#stageModify(1)});
			this.getRef("divMinusOne").addEventListener("click", () => {this.#stageModify(-1)});

			this.getRef("btnPlusOne").addEventListener("click", () => {this.#stageModify(1)});
			this.getRef("btnMinusOne").addEventListener("click", () => {this.#stageModify(-1)});

			this.getRef("btnPlusFive").addEventListener("click", () => {this.#stageModify(5)});
			this.getRef("btnMinusFive").addEventListener("click", () => {this.#stageModify(-5)});

			this.getRef("btnAccept").addEventListener("click", (event) => {this.#doModify(event)});

			this.IsInitialized = true;
		}

		#stageModify(value) {
			this.#StagedModify += value;

			const curVal = parseInt(this.getRef("ring").getAttribute("numerator"));

			this.getRef("btnAccept").innerHTML = this.#StagedModify
				? 	`<span class="content">
						<span class="equation">${curVal} ${this.#StagedModify > 0 ? "+" : "-"} ${Math.abs(this.#StagedModify)}</span>
						<span class="result" role="alert">= ${curVal + this.#StagedModify}</span>
					</span>`
				: null;
		}

		#doModify(event) {
			const newValue = this.getStagedValue();
			this.getRef("btnAccept").innerHTML = "";
			this.#StagedModify = 0;

			GW.LifeTracker.addStep({[this.getAttribute("key")]: newValue});

			event.stopPropagation();
		}

		setMax(value) {
			this.getRef("ring").setAttribute("denominator", value);
			this.#stageModify(this.#StagedModify * -1);
			this.#updateColor();
		}

		setLatest(value) {
			this.getRef("ring").setAttribute("numerator", value);
			this.#stageModify(this.#StagedModify * -1);
			this.#updateColor();
		}

		getStagedValue() {
			return parseInt(this.getRef("ring").getAttribute("numerator")) + this.#StagedModify;
		}

		#updateColor() {
			const ratio = this.#getRatio();

			let color = "#008000";
			let dotColor = "#50e150";
			if(ratio > 1) {
				dotColor = "#8000FF";
			}
			if(ratio <= 0.25) {
				color = "#B30000";
				dotColor = "#660000";
			}
			else if (ratio <= 0.5) {
				color = "#FF8000";
				dotColor = "#000000";
			}
			this.getRef("ring").style.setProperty("--progress-color", color);
			this.getRef("ring").style.setProperty("--dot-color", dotColor);
		}

		#getRatio() {
			const ring = this.getRef("ring");
			return parseInt(ring.getAttribute("numerator")) / parseInt(ring.getAttribute("denominator"));
		}
	}
	if(!customElements.get(ns.PlayerLifeEl.Name)) {
		customElements.define(ns.PlayerLifeEl.Name, ns.PlayerLifeEl);
	}
}) (window.GW.Controls = window.GW.Controls || {});
GW?.Controls?.Veil?.clearDefer("GW.Controls.PlayerLifeEl");