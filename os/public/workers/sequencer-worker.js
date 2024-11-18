// console.log("Sequencer worker starting")

timer()
setInterval(timer, 15)

function timer() {
	postMessage("tick")
}

onmessage = function(e) {}
