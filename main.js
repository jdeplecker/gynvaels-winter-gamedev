var main;
var mainrenderscene;
var inputState = {
	w: false,
	s: false,
	a: false,
	d: false
};

function mainInit() {
	main = document.getElementById("main");
	mainrenderscene = document.getElementById("mainrenderscene");
	renderInit();
	initRenderLoop();
	initMouse();
}

function initRenderLoop() {
	setInterval(drawScreen, 30);
	setInterval(updateInputState, 50);
}

function initMouse() {
	main.onmouseover= function(e) { 
		player.angle+=(e.layerX - W/2)/W * 0.1;
		if(e.layerY < H/3) {
			player.yaw-=0.05;
		}
		if(e.layerY > 2*H/3) {
			player.yaw+=0.05;
		}
	}
}

function keyEvent(e) {
	switch(e.which) {
		case(90): inputState.w = true; break;
		case(83): inputState.s = true; break;
		case(81): inputState.a = true; break;
		case(68): inputState.d = true; break;
	}
}

function updateInputState() {
	
	// vertical movement
	var currentSectorFloor = sectors[player.sector].floor;
	var gravity = 0.05;
	if(currentSectorFloor + EyeHeight > player.z) {
		player.velocity.z = 2*gravity;
	} else {
		player.velocity.z -= gravity;		
	}
	if(currentSectorFloor + EyeHeight + 2 * gravity > player.z && currentSectorFloor + EyeHeight - 2 * gravity < player.z){
		player.velocity.z = 0;
		player.z = currentSectorFloor + EyeHeight;
	}
	
	//horizontal movement
	var acceleration = 0.01;
	var maxacceleration = 0.1;
	player.velocity.x.clamp(-maxacceleration,maxacceleration);
	player.velocity.y.clamp(-maxacceleration,maxacceleration);
	if(player.velocity.x > 0) {
		player.velocity.x -= acceleration;
	} else {
		player.velocity.x += acceleration;
	}
	if(player.velocity.x + 2 * acceleration > 0 && player.velocity.x - 2 * acceleration < 0) {
		player.velocity.x = 0;
	}
	if(player.velocity.y > 0) {
		player.velocity.y -= acceleration;
	} else {
		player.velocity.y += acceleration;
	}
	if(player.velocity.y + 2 * acceleration > 0 && player.velocity.y - 2 * acceleration < 0) {
		player.velocity.y = 0;
	}
	
	
	var deltaMove = new Vector2D(0,0);
	if(inputState.w) {deltaMove.x += player.anglecos()*maxacceleration/3; deltaMove.y += player.anglesin()*maxacceleration/3; }
	if(inputState.s) {deltaMove.x -= player.anglecos()*maxacceleration/3; deltaMove.y -= player.anglesin()*maxacceleration/3; }
	if(inputState.a) {deltaMove.x += player.anglesin()*maxacceleration/3; deltaMove.y -= player.anglecos()*maxacceleration/3; }
	if(inputState.d) {deltaMove.x -= player.anglesin()*maxacceleration/3; deltaMove.y += player.anglecos()*maxacceleration/3; }
	
	player.velocity.x += deltaMove.x;
	player.velocity.y += deltaMove.y;
	
	player.x += player.velocity.x;
	player.y += player.velocity.y;
	player.z += player.velocity.z;
	
	//reset state
	inputState.w = false;
	inputState.s = false;
	inputState.a = false;
	inputState.d = false;
	
	//determine player sector
	var currentSector = sectors[player.sector];
	for (var neighbor in currentSector.neighbors) {
		var vertex1 = vertices[currentSector.vertices[neighbor]];
		var vertex2 = vertices[currentSector.vertices[+neighbor + 1]];
		var playerpoint = new Vector2D(player.x, player.y);
		
		if(currentSector.neighbors[neighbor] >= 0 && playerpoint.pointside(vertex1, vertex2) < 0) {
			player.sector = currentSector.neighbors[neighbor];
		}
	}
}