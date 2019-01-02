var main;
var mainrenderscene;

function mainInit() {
	main = document.getElementById("main");
	mainrenderscene = document.getElementById("mainrenderscene");
	renderInit();
	initMouse();
}

function initMouse() {
	main.onmouseover= function(e) { 
		player.angle+=(e.layerX - W/2)/W * 0.1;
		drawScreen();
		if(e.layerY < H/3) {
			player.yaw-=0.05;
			drawScreen();
		}
		if(e.layerY > 2*H/3) {
			player.yaw+=0.05;
			drawScreen();
		}
	}
}

function keyEvent(e) {
	switch(e.which) {
		case(90): player.z +=0.1; break;
		case(68): player.x +=0.1; break;
		case(81): player.x -=0.1; break;
		case(83): player.z -=0.1; break;
	}
	console.log(player);
	drawScreen();
}