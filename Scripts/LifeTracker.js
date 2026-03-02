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
		ns.Data.StartInstant = new Date();
		beginClock();
		ns.RedoStack = [];

		document.getElementById("diaNew").close();
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
		const isAutoSubmitOn = document.getElementById("cbxAutoSubmit").checked;

		const latestStep = ns.Data.Steps[ns.Data.Steps.length - 1];
		valueObj.Top = valueObj.Top
			?? (isAutoSubmitOn ? null : document.querySelector(`gw-player-life[key="Top"]`)?.getStagedValue())
			?? latestStep.Top;
		valueObj.Bottom = valueObj.Bottom
			?? (isAutoSubmitOn ? null : document.querySelector(`gw-player-life[key="Bottom"]`)?.getStagedValue())
			?? latestStep.Bottom;
		valueObj.TimeStr = getTimeStr();

		ns.Data.Steps.push(valueObj);
		if(!ns.Data.StartInstant) {
			ns.Data.StartInstant = new Date();
			beginClock();
		}
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
		if(ns.Data.StartInstant) {
			ns.Data.StartInstant = new Date(ns.Data.StartInstant);
			beginClock();
		}
		else {
			wakeLock();
		}
		renderFromData();

		if(localStorage.getItem("auto-submit") === "false") {
			document.getElementById("cbxAutoSubmit").checked = false;
		}
		updateAutoSubmit();
		document.getElementById("cbxAutoSubmit").closest(`gw-switch`).addEventListener("change", updateAutoSubmit);

		document.addEventListener("fullscreenchange", onFullscreenChanged);
	};

	const updateAutoSubmit = () => {
		const isAutoSubmitOn = document.getElementById("cbxAutoSubmit").checked;
		localStorage.setItem("auto-submit", isAutoSubmitOn)

		const lifeControls = document.querySelectorAll(`gw-player-life`);
		if(isAutoSubmitOn) {
			lifeControls.forEach(control => control.setAttribute("timeout", ""));
		}
		else {
			lifeControls.forEach(control => control.removeAttribute("timeout"));
		}
	};

	ns.onFullscreenClicked = () => {
		if(document.fullscreenElement) {
			document.exitFullscreen();
		}
		else {
			document.documentElement.requestFullscreen();
		}
	};

	const onFullscreenChanged = () => {
		document.getElementById("btnFullscreen").setAttribute(
			"aria-pressed",
			 document.fullscreenElement
				? "true"
				: "false"
		);
		wakeLock();
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

		const elapsedTimeStr = getElapsedTimeStr();

		const plTop = document.getElementById("plTop");
		plTop.setMax(startingTop);
		plTop.setLatest(latestTop);
		plTop.setTime(elapsedTimeStr);

		const plBottom = document.getElementById("plBottom");
		plBottom.setMax(startingBottom);
		plBottom.setLatest(latestBottom);
		plBottom.setTime(elapsedTimeStr);

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

	ns.ClockInterval = null;
	function beginClock() {
		if(ns.ClockInterval !== null) {
			clearInterval(ns.CLockInterval);
		}
		ns.ClockInterval = setInterval(() => {
			const elapsedTimeStr = getElapsedTimeStr();
			document.getElementById("plTop").setTime(elapsedTimeStr);
			document.getElementById("plBottom").setTime(elapsedTimeStr);
			wakeLock();
		}, 1000);
	}

	function getElapsedTimeStr() {
		if(!ns.Data.StartInstant) {
			return "";
		}
		const elapsedMs = new Date() - ns.Data.StartInstant;
		const elapsedSecs = Math.floor(elapsedMs / 1000.0);
		const elapsedMins = Math.floor(elapsedSecs / 60);
		const remainderSecs = elapsedSecs % 60;
		return `${elapsedMins < 10 ? "0" + elapsedMins : elapsedMins}:${remainderSecs < 10 ? "0" + remainderSecs : remainderSecs}`;
	}

	async function wakeLock() {
		try {
			await navigator.wakeLock.request("screen");
			console.log("Wake locked");
		} catch (err) {
			console.log("Cannot wake lock");
		}
	}

	window.addEventListener("DOMContentLoaded", ns.onDCL);
}) (window.GW.LifeTracker = window.GW.LifeTracker || {});