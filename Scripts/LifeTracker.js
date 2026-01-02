/**
 * @file Life Tracker main script
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
(function LifeTracker(ns) {
	ns.onNewSubmit = (event) => {
		event.preventDefault();
		const formData = new FormData(event.target);
		ns.Data.Steps = [{Top: parseInt(formData.get("top")), Bottom: parseInt(formData.get("bottom"))}];
		localStorage.setItem("data", JSON.stringify(ns.Data));

		document.getElementById("diaNew").close();
		renderFromData();
	};

	ns.onNewQB = (lifeMax) => {
		const newForm = document.querySelector(`form`);
		newForm.querySelector(`[name="top"]`).value = lifeMax;
		newForm.querySelector(`[name="bottom"]`).value = lifeMax;
	};

	ns.undo = function undo() {

	}

	ns.redo = function redo() {

	}

	ns.onDCL = () => {
		ns.Data = JSON.parse(localStorage.getItem("data")) || {Steps: [{Top: 40, Bottom: 40}]};
		renderFromData();
	};

	function renderFromData() {
		const startingTop = ns.Data.Steps[0].Top;
		const startingBottom = ns.Data.Steps[0].Bottom;

		const latestTop = ns.Data.Steps[ns.Data.Steps.length - 1].Top;
		const latestBottom = ns.Data.Steps[ns.Data.Steps.length - 1].Bottom;

		const newForm = document.querySelector(`form`);
		newForm.querySelector(`[name="top"]`).value = startingTop;
		newForm.querySelector(`[name="bottom"]`).value = startingBottom;

		const plTop = document.getElementById("plTop");
		plTop.setMax(startingTop);
		plTop.setLatest(latestTop);

		const plBottom = document.getElementById("plBottom");
		plBottom.setMax(startingTop);
		plBottom.setLatest(latestBottom);
	}
	window.addEventListener("DOMContentLoaded", ns.onDCL);
}) (window.GW.LifeTracker = window.GW.LifeTracker || {});