var vertices = [];
var sectors = [];
var player;
const W = 1024;
const H = 768;

const EyeHeight = 6;    // Camera height from floor when standing
const DuckHeight = 2.5;  // And when crouching
const HeadMargin = 1;    // How much room there is above camera before the head hits the ceiling
const KneeHeight = 2;    // How tall obstacles the player can simply walk over without jumping
const hfov = 0.73*H;  // Affects the horizontal field of vision
const vfov = .2*H;    // Affects the vertical field of vision

// Extend the default javascript prototype
Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

// Check if 2 number ranges overlap
function overlap(a0,a1,b0,b1) {
	return Math.min(a0,a1) <= Math.max(b0,b1) && Math.min(b0,b1) <= Math.max(a0,a1)
}

function intersectBox(x0, y0, x1, y1, x2, y2, x3, y3) {
	return overlap(x0, x1, x2, x3) && overlap(y0, y1, y2, y3);
}

// Calculate intersecting point between 2 lines
function intersect(a1, a2, b1, b2) {
	var x1 = new Vector2D(a1.vxs(a2), a1.x - a2.x);
	var x2 = new Vector2D(a3.vxs(a4), a3.x - a4.x);	
	var y1 = new Vector2D(a1.vxs(a2), a1.y - a2.y);
	var y2 = new Vector2D(a1.vxs(a2), a3.y - a4.y);
	var n1 = new Vector2D(a1.x - a2.x, a1.y - a2.y);
	var n2 = new Vector2D(a3.x - a4.x, a3.y - a4.y);
	var x = x1.vxs(x2) / n1.vxs(n2);
	var y = y1.vxs(y2) / n1.vxs(n2);
	
	return new Vector2D(x, y);
}

function renderInit() {
	loadData();
}

function loadData() {
    var data = JSON.parse(mapData);
	
	console.log(data);
	for(v in data.vertices) {
		for(var i = 1; i < data.vertices[v].length; i++) {
			vertices.push(new Vector2D(data.vertices[v][i], data.vertices[v][0]));
		}
	}
	
	for(s in data.sectors) {
		var sector = data.sectors[s];
		var floor = sector[0];
		var ceiling = sector[1];
		var vertexList = [];
		var neighbors = [];
		var i = 2;
		while(i < sector.length/2 + 1){
			vertexList.push(sector[i]);
			i += 2;
		}
		vertexList.push(vertexList[0]); // Ensure they are looped
		while(i < sector.length){
			neighbors.push(sector[i]);
			i += 2;
		}
		sectors.push(new Sector(floor, ceiling, vertexList, neighbors));
	}
	
	player = new Player(data.player[0], data.player[1], 0, new Vector3D(0,0,0), data.player[2], 0, data.player[3]);
}

function vLine(x, y1, y2, topColor, middleColor, bottomColor) {
	
}

function drawScreen() {
	var sectorQueue = [];
	sectorQueue.push(player.sector);
	renderedSectors = [];
	
	while (sectorQueue.length > 0) {		
		var currentSector = sectorQueue.shift();
		
		for(var vertexIndex = 0; vertexIndex < currentSector.vertices.length - 1; vertexIndex+=1) {
			var currentVertex = currentSector.vertices[vertexIndex];
			var nextVertex = currentSector.vertices[vertexIndex + 1];
			
			// Get endpoints relative to player			
			var vx1 = currentVertex.x - player.x, vy1 = currentVertex.y - player.y;		
			var vx1 = nextVertex.x - player.x, vy1 = nextVertex.y - player.y;
			var pcos = pcos = player.anglecos(), psin = player.anglesin();
			
			// Check if wall is visible
			if(tz1 <= 0 && tz2 <= 0) continue;
			
			// Partial clip
			 if(tz1 <= 0 || tz2 <= 0)
			{
				var nearz = 1e-4, farz = 5, nearside = 1e-5, farside = 20.;
				// Find an intersection between the wall and the approximate edges of player's view
				i1 = intersect(tx1,tz1,tx2,tz2, -nearside,nearz, -farside,farz);
				i2 = intersect(tx1,tz1,tx2,tz2,  nearside,nearz,  farside,farz);
				if(tz1 < nearz) { if(i1.y > 0) { tx1 = i1.x; tz1 = i1.y; } else { tx1 = i2.x; tz1 = i2.y; } }
				if(tz2 < nearz) { if(i1.y > 0) { tx2 = i1.x; tz2 = i1.y; } else { tx2 = i2.x; tz2 = i2.y; } }
			}
			
			// Perspective transformation */
			var xscale1 = hfov / tz1, yscale1 = vfov / tz1;    var x1 = W/2 - tx1 * xscale1;
			var xscale2 = hfov / tz2, yscale2 = vfov / tz2;    var x2 = W/2 - tx2 * xscale2;
			
			if(x1 >= x2 || x2 < now.sx1 || x1 > now.sx2) continue; // Only render if it's visible
			/* Acquire the floor and ceiling heights, relative to where the player's view is */
			var yceil  = currentSector.ceiling  - player.z;
			var yfloor = currentSector.floor - player.z;
			
			// check sector through portal TODO
			
			// convert to screen coordinates
			function yaw(y, z) { return y + z * player.yaw; }			
			var y1a  = H/2 - yaw(yceil, tz1) * yscale1,  y1b = H/2 - yaw(yfloor, tz1) * yscale1;
			var y2a  = H/2 - yaw(yceil, tz2) * yscale2,  y2b = H/2 - yaw(yfloor, tz2) * yscale2;
			
			//TODO continue
			
		}
		
		
		// for neighbours
			// if renderedSectors includes(neighbor)
			// push queue
	}
	
}

class Vector3D {
	constructor(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
	}
}

class Vector2D {
	constructor(x, y) { 
		this.x = x; this.y = y; 
	}
	
	// Vector cross product
	vxs(x2, y2) {
		return this.x * y2 - x2 * this.y;
	}
	
	vxs(v) {
		return this.x * v.y - v.x * this.y;
	}
	
	pointside(x0, y0, x1, y1) {
		return vxs(x1 - x0, y1 - y0, this.x - x0, this.y - y0);
	}
}

class Sector {
	constructor(floor, ceiling, vertices, neighbors) {
		this.floor = floor;
		this.ceiling = ceiling;
		this.vertices = vertices; // Indices of vertices clockwise
		this.neighbors = neighbors; // Indices of neighbouring sectors
	}	
}

class Player {
	constructor(x, y, z, velocity, angle, yaw, sector) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.velocity = velocity;
		this.angle = angle;
		this.yaw = yaw;
		this.sector = sector;
	}
	
	anglesin() {
		return Math.sin(angle);
	}
	
	anglecos() {
		return Math.cos(angle);
	}
}