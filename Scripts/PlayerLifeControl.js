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
					justify-self: center;
					grid-column: 1 / span 2;
					grid-row: 1 / span 1;
					height: 100%;
				}

				.accept {
					grid-column: 1 / span 2;
					grid-row: 1 / span 1;

					z-index: 2;

					&:empty {
						display: none;
					}
				}

				.adjuster {
					display: grid;
					grid-template-columns: auto auto;
					justify-content: center;
					align-items: center;
					gap: 5px;
					font-size: 1.5em;
				}

				.minus-one {
					grid-column: 1;
					grid-row: 3;
				}
				.plus-one {
					grid-column: 2;
					grid-row: 3;
				}
				.minus-five {
					grid-column: 1;
					grid-row: 2;
				}
				.plus-five {
					grid-column: 2;
					grid-row: 2;
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
					name="${this.getAttribute("name")} Life Total"
					disablesrnotif
					numerator="40"
					denominator="40"
				></gw-progress-ring>
				<button id="${this.getId("btnPlusOne")}" class="adjuster plus-one">
					<gw-icon iconKey="plus" name="Add"></gw-icon>
					1
				</button>
				<button id="${this.getId("btnMinusOne")}" class="adjuster minus-one">
					<gw-icon iconKey="minus" name="Subtract"></gw-icon>
					1
				</button>
				<button id="${this.getId("btnPlusFive")}" class="adjuster plus-five">
					<gw-icon iconKey="plus" name="Add"></gw-icon>
					5
				</button>
				<button id="${this.getId("btnMinusFive")}" class="adjuster minus-five">
					<gw-icon iconKey="minus" name="Subtract"></gw-icon>
					5
				</button>
				<button id="${this.getId("btnAccept")}" class="accept"></button>
			`;

			this.IsInitialized = true;
		}

		setMax(value) {
			this.getRef("ring").setAttribute("denominator", value);
		}

		setLatest(value) {
			this.getRef("ring").setAttribute("numerator", value);
		}
	}
	if(!customElements.get(ns.PlayerLifeEl.Name)) {
		customElements.define(ns.PlayerLifeEl.Name, ns.PlayerLifeEl);
	}
}) (window.GW.Controls = window.GW.Controls || {});
GW?.Controls?.Veil?.clearDefer("GW.Controls.PlayerLifeEl");