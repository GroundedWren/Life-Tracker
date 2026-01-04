/**
 * @file Life Tracker main script
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
(function LifeTracker(ns) {
	ns.onNewSubmit = (event) => {
		event.preventDefault();
		const formData = new FormData(event.target);
		ns.Data.Steps = [{
			Top: parseInt(formData.get("top")),
			Bottom: parseInt(formData.get("bottom")),
			TimeStr: getTimeStr()}
		];

		document.getElementById("diaNew").close();
		document.documentElement.requestFullscreen();
		renderFromData();
	};

	ns.onNewQB = (lifeMax) => {
		const newForm = document.querySelector(`form`);
		newForm.querySelector(`[name="top"]`).value = lifeMax;
		newForm.querySelector(`[name="bottom"]`).value = lifeMax;
	};

	ns.RedoStack = [];
	ns.undo = function undo() {
		ns.RedoStack.push(ns.Data.Steps.pop());
		renderFromData();
	}

	ns.redo = function redo() {
		ns.Data.Steps.push(ns.RedoStack.pop());
		renderFromData();
	}

	ns.addStep = function addStep(valueObj) {
		const latestStep = ns.Data.Steps[ns.Data.Steps.length - 1];
		valueObj.Top = valueObj.Top ?? latestStep.Top;
		valueObj.Bottom = valueObj.Bottom ?? latestStep.Bottom;
		valueObj.TimeStr = getTimeStr();

		ns.Data.Steps.push(valueObj);
		ns.RedoStack = [];
		renderFromData();
	}

	ns.setStep = function setStep(index) {
		ns.RedoStack = ns.Data.Steps.splice(index + 1);
		document.getElementById("diaHistory").close();
		renderFromData();
	}

	ns.showHistory = function showHistory() {
		document.getElementById("tbodyHistory").innerHTML = ns.Data.Steps.map((stepObj, index, ary) => {
			const topDiff = index > 0 ? stepObj.Top - ary[index - 1].Top : 0;
			const bottomDiff = index > 0 ? stepObj.Bottom - ary[index - 1]?.Bottom : 0;
			return `
			<tr>
				<th scope="row">
					<a
						class="full"
						href="javascript:void(0)"
						onclick="GW.LifeTracker.setStep(${index})"
					>${index + 1} - ${stepObj.TimeStr}<a>
				</th>
				<td>${stepObj.Top}${topDiff ? `<mark>${getDiffStr(topDiff)}</mark>` : "<br>&nbsp;"}</td>
				<td>${stepObj.Bottom}${bottomDiff ? `<mark>${getDiffStr(bottomDiff)}</mark>` : "<br>&nbsp;"}</td>
			</tr>
		`}).join("");
		document.getElementById("diaHistory").showModal();
	}

	function getDiffStr(diff) {
		return `<br>(${diff > 0 ? "+" : ""}${diff})`;
	}

	ns.onDCL = async () => {
		ns.Data = JSON.parse(localStorage.getItem("data")) || {Steps: [{Top: 40, Bottom: 40, TimeStr: getTimeStr()}]};
		renderFromData();

		document.documentElement.addEventListener("click", (event) => {
			if(!event.target.closest(`button, input, select, summary`)) {
				document.documentElement.requestFullscreen();
			}
		});

		try {
			await navigator.wakeLock.request("screen");
			console.log("Wake locked");
		} catch (err) {
			console.log("Cannot wake lock");
		}
	};

	function getTimeStr() {
		return new Date().toLocaleTimeString();
	}

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

		if(ns.Data.Steps.length > 1) {
			document.getElementById("btnUndo").removeAttribute("disabled");
		}
		else {
			document.getElementById("btnUndo").setAttribute("disabled", "");
		}

		if(ns.RedoStack.length >= 1) {
			document.getElementById("btnRedo").removeAttribute("disabled");
		}
		else {
			document.getElementById("btnRedo").setAttribute("disabled", "");
		}

		localStorage.setItem("data", JSON.stringify(ns.Data));
	}
	window.addEventListener("DOMContentLoaded", ns.onDCL);
}) (window.GW.LifeTracker = window.GW.LifeTracker || {});