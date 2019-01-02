var xmlns = "http://www.w3.org/2000/svg";

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
	var x2 = new Vector2D(b1.vxs(b2), b1.x - b2.x);	
	var y1 = new Vector2D(a1.vxs(a2), a1.y - a2.y);
	var y2 = new Vector2D(a1.vxs(a2), b1.y - b2.y);
	var n1 = new Vector2D(a1.x - a2.x, a1.y - a2.y);
	var n2 = new Vector2D(b1.x - b2.x, b1.y - b2.y);
	var x = x1.vxs(x2) / n1.vxs(n2);
	var y = y1.vxs(y2) / n1.vxs(n2);
	
	return new Vector2D(x, y);
}

function renderInit() {
	loadData();
	drawScreen();
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
			i += 1;
		}
		vertexList.push(vertexList[0]); // Ensure they are looped
		while(i < sector.length){
			neighbors.push(sector[i]);
			i += 1;
		}
		sectors.push(new Sector(floor, ceiling, vertexList, neighbors));
	}
	
	player = new Player(data.player[0], data.player[1], 0, new Vector3D(0,0,0), data.player[2], 0, data.player[3]);
}

function vLine(x, y1, y2, topColor, middleColor, bottomColor) {	
	y1 = (y1 || 0).clamp(0, H-1);
	y2 = (y2 || 0).clamp(0, H-1);
	
	if(y1 === y2) { 
		//drawLine(x, y1, x, y1, middleColor);
	} else if(y2 > y1){
		drawLine(x, 0, x, y1, topColor);
		drawLine(x, y1 + 2, x, y2 - 1, middleColor);
		drawLine(x, y2, x, H-1, bottomColor);
	}
}

function drawLine(x1, y1, x2, y2, color) {	
	var line = document.createElementNS(xmlns, "line");
	line.setAttributeNS(null,"x1",x1);
	line.setAttributeNS(null,"y1",y1);
	line.setAttributeNS(null,"x2",x2);
	line.setAttributeNS(null,"y2",y2);
	line.setAttributeNS(null,"style", "stroke: " + color);
	mainrenderscene.appendChild(line);
}

function drawRect(x1, y1, x2, y2, color) {	
	var rect = document.createElementNS(xmlns, "rect");
	rect.setAttributeNS(null,"x",x1);
	rect.setAttributeNS(null,"y",y1);
	rect.setAttributeNS(null,"width",x2 - x1);
	rect.setAttributeNS(null,"height",y2 - y1);
	rect.setAttributeNS(null,"fill", color);
	mainrenderscene.appendChild(rect);
}

function drawPolygon(points, color) {
	var poly = document.createElementNS(xmlns, "polygon");
	poly.setAttributeNS(null,"points",points);
	poly.setAttributeNS(null,"fill", color);
	mainrenderscene.appendChild(poly);	
}

function drawScreen() {
	while (mainrenderscene.lastChild) {mainrenderscene.removeChild(mainrenderscene.lastChild); }
	var sectorQueue = [];
	sectorQueue.push({ sectorno: player.sector, sx1: 0, sx2: W-1});
	var ytop = [];
	var ybottom = [];
	for(var i = 0; i < W + 1; i += 1){ ytop.push(0); }
	for(var i = 0; i < W + 1; i += 1){ ybottom.push(H - 1); }
	renderedSectors = [];
	
	while (sectorQueue.length > 0) {
		var currentRenderOp = sectorQueue.shift();
		var currentSector = sectors[currentRenderOp.sectorno];
		var sx1 = currentRenderOp.sx1;
		var sx2 = currentRenderOp.sx2;
		
		for(var vertexIndex = 0; vertexIndex < currentSector.vertices.length - 1; vertexIndex+=1) {
			var currentVertex = vertices[currentSector.vertices[vertexIndex + 0]];
			var nextVertex = vertices[currentSector.vertices[vertexIndex + 1]];
			
			// Get endpoints relative to player			
			var vx1 = currentVertex.x - player.x, vy1 = currentVertex.y - player.y;		
			var vx2 = nextVertex.x - player.x, vy2 = nextVertex.y - player.y;
			var pcos = player.anglecos(), psin = player.anglesin();			
			var tx1 = vx1 * psin - vy1 * pcos,  tz1 = vx1 * pcos + vy1 * psin;
			var tx2 = vx2 * psin - vy2 * pcos,  tz2 = vx2 * pcos + vy2 * psin;
			// Check if wall is visible
			if(tz1 <= 0 && tz2 <= 0) continue;
			
			// Partial clip
			if(tz1 <= 0 || tz2 <= 0)
			{
				var nearz = 1e-4, farz = 5, nearside = 1e-5, farside = 20.;
				// Find an intersection between the wall and the approximate edges of player's view
				i1 = intersect(new Vector2D(tx1,tz1), new Vector2D(tx2,tz2), new Vector2D(-nearside,nearz), new Vector2D(-farside,farz));
				i2 = intersect(new Vector2D(tx1,tz1), new Vector2D(tx2,tz2), new Vector2D(nearside,nearz), new Vector2D(farside,farz));
				if(tz1 < nearz) { if(i1.y > 0) { tx1 = i1.x; tz1 = i1.y; } else { tx1 = i2.x; tz1 = i2.y; } }
				if(tz2 < nearz) { if(i1.y > 0) { tx2 = i1.x; tz2 = i1.y; } else { tx2 = i2.x; tz2 = i2.y; } }
			}
			
			// Perspective transformation */
			var xscale1 = hfov / tz1, yscale1 = vfov / tz1; var x1 = W/2 - tx1 * xscale1;
			var xscale2 = hfov / tz2, yscale2 = vfov / tz2; var x2 = W/2 - tx2 * xscale2;
			
			if(x1 >= x2 || x2 < sx1 || x1 > sx2) continue; // Only render if it's visible
			/* Acquire the floor and ceiling heights, relative to where the player's view is */
			var yceil  = currentSector.ceiling  - player.z;
			var yfloor = currentSector.floor - player.z;
			
			// check sector through portal TODO
			
			// convert to screen coordinates
			function yaw(y, z) { return y + z * player.yaw; }			
			var y1a  = H/2 - yaw(yceil, tz1) * yscale1,  y1b = H/2 - yaw(yfloor, tz1) * yscale1;
			var y2a  = H/2 - yaw(yceil, tz2) * yscale2,  y2b = H/2 - yaw(yfloor, tz2) * yscale2;
			
			var beginx = Math.round(Math.max(x1, sx1)), endx = Math.round(Math.min(x2, sx2));
			
			var ceilingpoints = "";
			var wallpoints = "";
			var floorpoints = "";
			
			// Add top polygon points
			for(var x = beginx + 1; x <= endx; x+=1) {	
				var ya = (x - x1) * (y2a-y1a) / (x2-x1) + y1a, cya = ya.clamp(ytop[x],ybottom[x]); // top
				var yb = (x - x1) * (y2b-y1b) / (x2-x1) + y1b, cyb = yb.clamp(ytop[x],ybottom[x]); // bottom
				
				ceilingpoints += x + "," + ytop[x] + " ";
				wallpoints += x + "," + cya + " ";
				floorpoints += x + "," + (cyb + 1) + " ";
			}
			
			// Add bottom polygon points
			for(var x = endx; x >= beginx + 1; x-=1) {	
				var ya = (x - x1) * (y2a-y1a) / (x2-x1) + y1a, cya = ya.clamp(ytop[x],ybottom[x]); // top
				var yb = (x - x1) * (y2b-y1b) / (x2-x1) + y1b, cyb = yb.clamp(ytop[x],ybottom[x]); // bottom
				
				ceilingpoints += x + "," + (cya - 1) + " ";
				wallpoints += x + "," + cyb + " ";
				floorpoints += x + "," + (ybottom[x] + 1) + " ";
			}
			
			drawPolygon(ceilingpoints, "grey");
			if(currentSector.neighbors[vertexIndex] >= 0) {
				drawPolygon(wallpoints, "red");
			} else {
				drawPolygon(wallpoints, "white");
			}
			drawPolygon(floorpoints, "green");
				
			if (currentSector.neighbors[vertexIndex] >= 0 && !renderedSectors.includes(currentSector.neighbors[vertexIndex]) && endx >= beginx){
				// sectorQueue.push({ sectorno: currentSector.neighbors[vertexIndex], sx1: 0, sx2: W-1})
			}
		}
		renderedSectors.push(currentRenderOp.sectorno);		
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
		return Math.sin(this.angle);
	}
	
	anglecos() {
		return Math.cos(this.angle);
	}
}